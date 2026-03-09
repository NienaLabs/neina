import { inngest } from "./client";
import { createAgent, createNetwork, createState, openai } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { keywordExtractorAgent, improveResumeNudgeAgent, improveResumeKeywordsAgent, improveResumeFullAgent, improveResumeRefineAgent, improveResumeEnrichAgent, coverLetterAgent } from "./agents";
import { getTailoringPrompt, COVER_LETTER_PROMPT, EXTRACT_KEYWORDS_PROMPT } from "@/constants/prompts";
import { lastAssistantTextMessageContent, validJson } from "@/lib/utils";
import { IMPROVE_RESUME_PROMPT_NUDGE, IMPROVE_RESUME_PROMPT_KEYWORDS, IMPROVE_RESUME_PROMPT_FULL, VALIDATION_POLISH_PROMPT, CRITICAL_TRUTHFULNESS_RULES_TEMPLATE, RESUME_SCHEMA_EXAMPLE } from "@/constants/prompts-backend";





function extractJson(str: string): string {
  let jsonStr = str;
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    jsonStr = match[1];
  }
  const parsed = validJson(jsonStr);
  return parsed ? JSON.stringify(parsed) : "{}";
}

// --- Refactored Master Network Orchestration ---

/**
 * Proxy agent for job keyword extraction that uses the network state for dynamic input.
 */
const jobKeywordProxy = createAgent({
  name: "job-keyword-proxy",
  system: async ({ network }: { network?: any }) => {
    return `${EXTRACT_KEYWORDS_PROMPT}\n\nJOB DESCRIPTION:\n${network?.state?.data?.jobText}`;
  },
  model: keywordExtractorAgent.model,
  lifecycle: {
    onResponse: async ({ result, network }: { result: any, network?: any }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.keywordExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

/**
 * Proxy agent for resume keyword extraction that uses the network state for dynamic input.
 */
const resumeKeywordProxy = createAgent({
  name: "resume-keyword-proxy",
  system: async ({ network }: { network?: any }) => {
    const tailored = network?.state?.data?.tailoredContentData;
    const textToExtract = JSON.stringify(tailored);
    return `${EXTRACT_KEYWORDS_PROMPT}\n\nTAILORED RESUME CONTENT:\n${textToExtract}`;
  },
  model: keywordExtractorAgent.model,
  lifecycle: {
    onResponse: async ({ result, network }: { result: any, network?: any }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.keywordExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

const getAgentIdForMode = (mode: string) => {
  if (mode === "nudge") return "improveResumeNudgeAgent";
  if (mode === "full") return "improveResumeFullAgent";
  if (mode === "refine") return "improveResumeRefineAgent";
  if (mode === "enrich") return "improveResumeEnrichAgent";
  return "improveResumeKeywordsAgent";
};

const getAgentForMode = (mode: string) => {
  if (mode === "nudge") return improveResumeNudgeAgent;
  if (mode === "full") return improveResumeFullAgent;
  if (mode === "refine") return improveResumeRefineAgent;
  if (mode === "enrich") return improveResumeEnrichAgent;
  return improveResumeKeywordsAgent;
};

/**
 * The Tailoring Orchestrator Network consolidates all AI steps into a single network run
 * to avoid Inngest step ID collisions and nesting errors.
 */
const tailoringOrchestratorNetwork = createNetwork({
  name: "tailoring-orchestrator",
  agents: [
    jobKeywordProxy,
    resumeKeywordProxy,
    improveResumeNudgeAgent,
    improveResumeKeywordsAgent,
    improveResumeFullAgent,
    improveResumeRefineAgent,
    improveResumeEnrichAgent
  ],
  defaultState: createState({
    stage: 'JOB_KEYWORDS',
    tailoringMode: 'keywords',
    jobText: '',
    resumeContent: '',
    primaryResumeContent: '',
    jobKeywordsData: {} as any,
    tailoredContentData: {} as any,
    resumeKeywordsData: {} as any,
    filledTailoringPrompt: '',
    skipTailoring: false,
    // Legacy mapping support for agents.ts lifecycles
    keywordExtractorAgent: '',
    improveResumeNudgeAgent: '',
    improveResumeKeywordsAgent: '',
    improveResumeFullAgent: '',
    improveResumeRefineAgent: '',
    improveResumeEnrichAgent: '',
  }),
  router: ({ network, lastResult }) => {
    const state = network.state.data;

    // 1. Transition from JOB_KEYWORDS to TAILORING
    if (state.stage === 'JOB_KEYWORDS' && lastResult?.agentName === 'job-keyword-proxy') {
      state.jobKeywordsData = JSON.parse(state.keywordExtractorAgent || "{}");

      // If we only needed keywords (Update flow), we might be done or skip to resume keywords
      if (state.skipTailoring) {
        state.stage = 'RESUME_KEYWORDS';
      } else {
        state.stage = 'TAILORING';
      }
    }

    // 2. Transition from TAILORING to RESUME_KEYWORDS
    else if (state.stage === 'TAILORING' && lastResult?.agentName.includes('improve-resume')) {
      const agentId = getAgentIdForMode(state.tailoringMode);
      state.tailoredContentData = JSON.parse(state[agentId] || "{}");
      state.stage = 'RESUME_KEYWORDS';
    }

    // 3. Transition from RESUME_KEYWORDS to COMPLETED
    else if (state.stage === 'RESUME_KEYWORDS' && lastResult?.agentName === 'resume-keyword-proxy') {
      state.resumeKeywordsData = JSON.parse(state.keywordExtractorAgent || "{}");
      state.stage = 'COMPLETED';
      return undefined;
    }

    // --- Routing ---
    if (state.stage === 'JOB_KEYWORDS') return jobKeywordProxy;

    if (state.stage === 'TAILORING') {
      // Lazy construction of the prompt if not already done
      if (!state.filledTailoringPrompt) {
        // Construct prompt logic (moved from function body to ensure it's captured in state)
        const mode = state.tailoringMode;
        let template = IMPROVE_RESUME_PROMPT_KEYWORDS;
        if (mode === 'nudge') template = IMPROVE_RESUME_PROMPT_NUDGE;
        if (mode === 'full') template = IMPROVE_RESUME_PROMPT_FULL;
        if (mode === 'refine') template = VALIDATION_POLISH_PROMPT;
        if (mode === 'enrich') template = IMPROVE_RESUME_PROMPT_FULL;

        const truthfulnessRules = CRITICAL_TRUTHFULNESS_RULES_TEMPLATE.replace(
          "{rule_7}",
          "DO NOT fabricate any information."
        );

        const keywords = [
          ...(state.jobKeywordsData.required_skills || []),
          ...(state.jobKeywordsData.preferred_skills || []),
          ...(state.jobKeywordsData.keywords || []),
          ...(state.jobKeywordsData.key_responsibilities || [])
        ].filter(Boolean);
        const uniqueKeywords = Array.from(new Set(keywords.map((k: any) => String(k).toLowerCase())));

        state.filledTailoringPrompt = template
          .replace("{critical_truthfulness_rules}", truthfulnessRules)
          .replace("{job_description}", state.jobText)
          .replace("{job_keywords}", uniqueKeywords.join(", "))
          .replace("{original_resume}", state.resumeContent)
          .replace("{master_resume}", state.primaryResumeContent)
          .replace("{output_language}", "English")
          .replace("{schema}", RESUME_SCHEMA_EXAMPLE);
      }
      return getAgentForMode(state.tailoringMode);
    }

    if (state.stage === 'RESUME_KEYWORDS') {
      // Prepare content for extraction
      if (!state.tailoredContentData && state.stage === 'RESUME_KEYWORDS') {
        // This handles the Update flow where content is passed directly
        const content = state.tailoredContentData || state.resumeContent;
        // The proxy agent will handle the stringification
      }
      return resumeKeywordProxy;
    }

    return undefined;
  }
});

const coverLetterNetwork = createNetwork({
  name: "cover-letter-network",
  agents: [coverLetterAgent],
  defaultState: createState<{ coverLetterAgent: string }>({ coverLetterAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return coverLetterAgent;
  }
});

export const tailoredResumeCreated = inngest.createFunction(
  { id: "tailored-resume-AI-workflow", concurrency: 1 },
  { event: "app/tailored-resume.created" },
  async ({ step, event }) => {
    try {
      // 1. Extract Job Keywords (Source of Truth for Scoring)
      const jobText = event.data.description || "";
      const jobContext = await extractKeywords(step, "process-job-keywords", jobText);

      // 2. Tailor Resume based on Mode
      const mode = event.data.tailoringMode || "keywords";
      let network;
      let agentId;

      if (mode === "nudge") {
        network = nudgeTailoringNetwork;
        agentId = "improveResumeNudgeAgent";
      } else if (mode === "full") {
        network = fullTailoringNetwork;
        agentId = "improveResumeFullAgent";
      } else if (mode === "refine") {
        network = refineTailoringNetwork;
        agentId = "improveResumeRefineAgent";
      } else if (mode === "enrich") {
         // Enrich acts like a "Full" tailor but with specific focus on adding detail
        network = enrichTailoringNetwork;
        agentId = "improveResumeEnrichAgent";
      } else {
        network = keywordsTailoringNetwork;
        agentId = "improveResumeKeywordsAgent";
      }

      // Construct Prompt
      let template = IMPROVE_RESUME_PROMPT_KEYWORDS;
      if (mode === 'nudge') template = IMPROVE_RESUME_PROMPT_NUDGE;
      if (mode === 'full') template = IMPROVE_RESUME_PROMPT_FULL;
      if (mode === 'refine') template = VALIDATION_POLISH_PROMPT;
      if (mode === 'enrich') template = IMPROVE_RESUME_PROMPT_FULL; 

      const truthfulnessRules = CRITICAL_TRUTHFULNESS_RULES_TEMPLATE.replace(
          "{rule_7}",
          "DO NOT fabricate any information."
      );

      // Fetch Primary Resume Content if needed (Refine mode)
      let primaryResumeContent = "";
      if (mode === 'refine' && event.data.primaryResumeId) {
        const primaryResume = await step.run("fetch-primary-resume", async () => {
          return await prisma.resume.findUnique({
            where: { id: event.data.primaryResumeId },
            select: { content: true }
          });
        });
        if (primaryResume) {
          primaryResumeContent = primaryResume.content;
        }
      }

      // Pre-process content
      try {
        const parsed = JSON.parse(resumeContent);
        resumeContent = JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, it's already text/markdown - use as is
        // This handles the initial creation case where content is markdown
      }

      let filledPrompt = template
        .replace("{critical_truthfulness_rules}", truthfulnessRules)
        .replace("{job_description}", jobText) // Safe job text
        .replace("{job_keywords}", (jobContext.keywords || []).join(", "))
        .replace("{original_resume}", resumeContent)
        .replace("{master_resume}", primaryResumeContent) // For verification in Refine mode
        .replace("{output_language}", "English")
        .replace("{schema}", RESUME_SCHEMA_EXAMPLE);

      const tailorState = createState<any>({ [agentId]: "" });
      const tailorResult = await network.run(filledPrompt, { state: tailorState });

      const tailoredContent = await step.run("process-tailored-content", async () => {
        return JSON.parse(tailorResult.state.data[agentId] || "{}");
      });

      // 3. Extract Keywords from Tailored Resume (for Verification/Scoring)
      const contentString = formatResumeContentString(tailoredContent);
      
      const tailoredResumeKeywords = (await extractKeywords(step, "process-tailored-keywords", contentString)).keywords;

      // 4. Calculate Word Match Score
      const scoreData = await calculateScore(step, "calculate-word-match-score", jobContext.keywords, tailoredResumeKeywords);

      // Save to DB
      await step.run("save-tailored-resume", async () => {
          const finalContent = jsonToMarkdown(tailoredContent);
          
          await prisma.tailoredResume.update({
            where: { id: event.data.resumeId },
            data: {
              content: finalContent, 
              extractedData: tailoredContent, 
              analysisData: JSON.stringify({
                  matches: scoreData.matchedKeywords,
                  missing: scoreData.missingKeywords
              }),
              scores: {
                  finalScore: scoreData.finalScore,
                  wordMatchScore: scoreData.finalScore,
                  totalKeywords: scoreData.totalKeywords,
                  matchedCount: scoreData.matchedKeywords.length
              },
              status: "COMPLETED"
            }
          });
      });

      // Notify SSE
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'TAILORED_RESUME_READY',
        data: {
          resumeId: event.data.resumeId,
          action: event.data.tailoringMode
        }
      });

      return { success: true, score: scoreData.finalScore };

    } catch (error) {
      console.error("Error in Master Tailoring workflow:", error);
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'TAILORED_RESUME_FAILED',
          data: {
            resumeId: event.data.resumeId,
            action: event.data.tailoringMode
          }
        });
      } catch (_) { /* best-effort */ }

      await step.run("cleanup-failed-resume", async () => {
        await prisma.tailoredResume.delete({ where: { id: event.data.resumeId } }).catch(() => { });
      });
      throw error;
    }
  }
);

export const tailoredResumeUpdated = inngest.createFunction(
  { id: "tailored-resume-updated-workflow", concurrency: 1 },
  { event: "app/tailored-resume.updated" },
  async ({ step, event }) => {
    try {
      // Safety delay for API rate limits
      await step.sleep('rate-limit-cooldown', '10s');
      const jobText = event.data.description || "";
      const jobContext = await extractKeywords(step, "extract-job-keywords-update", jobText);

      // 2. Tailoring is NOT re-run on simple update unless explicitly requested?
      // The `tailoredResumeUpdated` event usually implies the USER edited the content manually or requested a re-generation.
      // We assume the content in `event.data.content` is the Latest.
      
      const tailoredContentString = event.data.content;

      // 3. Extract Keywords from Current Content (for Scoring)
      const tailoredResumeKeywords = (await extractKeywords(step, "extract-tailored-keywords-update", tailoredContentString)).keywords;

      // 4. Calculate Word Match Score
      const scoreData = await calculateScore(step, "calculate-word-match-score-update", jobContext.keywords, tailoredResumeKeywords);

      // Save to DB
      await step.run("save-tailored-resume-update", async () => {
        await prisma.tailoredResume.update({
          where: { id: event.data.resumeId },
          data: {
            content: tailoredContentString,
            analysisData: JSON.stringify({
              matches: scoreData.matchedKeywords,
              missing: scoreData.missingKeywords
            }),
            scores: {
              finalScore: scoreData.finalScore,
              wordMatchScore: scoreData.finalScore,
              totalKeywords: scoreData.totalKeywords,
              matchedCount: scoreData.matchedKeywords.length
            },
            status: "COMPLETED"
          }
        });
      });

      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'TAILORED_RESUME_READY',
        data: { resumeId: event.data.resumeId }
      });

      return { success: true, score: scoreData.finalScore };

    } catch (error) {
      console.error("Error in Master Update workflow:", error);
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'TAILORED_RESUME_FAILED',
          data: { resumeId: event.data.resumeId }
        });
      } catch (_) { /* best-effort */ }
      await step.run("reset-status", async () => {
        await prisma.tailoredResume.update({
          where: { id: event.data.resumeId },
          data: { status: "COMPLETED" }
        });
      });
      throw error;
    }
  }
);

export const coverLetterGenerated = inngest.createFunction(
  { id: "cover-letter-generation-workflow", concurrency: 1 },
  { event: "app/cover-letter.generation-requested" },
  async ({ step, event }) => {
    try {
      // Safety delay for API rate limits
      await step.sleep('rate-limit-cooldown', '10s');
      const { resumeId, content, jobDescription } = event.data;

      // Run Agent
      const state = createState<{ coverLetterAgent: string }>({ coverLetterAgent: "" });

      const filledPrompt = `
  ${COVER_LETTER_PROMPT}
  
  RESUME CONTENT:
  ${content}
  
  JOB DESCRIPTION:
  ${jobDescription}
  `;
  
          const result = await coverLetterNetwork.run(filledPrompt, { state });
          
          const data = JSON.parse(result.state.data.coverLetterAgent || "{}");
          
          const polishedCoverLetter = polishCoverLetter(data.coverLetter || "");

          await step.run("save-cover-letter", async () => {
               await prisma.tailoredResume.update({
                   where: { id: resumeId },
                   data: {
                       coverLetter: polishedCoverLetter,
                       status: "COMPLETED"
                   }
               });
          });

      // Notify client via SSE that cover letter is ready
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'COVER_LETTER_READY',
        data: { resumeId: event.data.resumeId }
      });

      return { success: true };

    } catch (error) {
      console.error("Cover letter generation failed", error);
      // Notify client via SSE that cover letter generation failed
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'TAILORED_RESUME_FAILED',
          data: { resumeId: event.data.resumeId }
        });
      } catch (_) { /* best-effort */ }
      await step.run("revert-status", async () => {
        await prisma.tailoredResume.update({
          where: { id: event.data.resumeId },
          data: { status: "COMPLETED" }
        });
      });
      throw error;
    }
  }
);


/* ============================================================================
   Helper Functions
   ============================================================================ */

/**
 * Extracts and processes keywords from the given text using the AI agent.
 */
async function extractKeywords(step: any, stepId: string, text: string) {
    const keywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
    // Execute Agent Network (Must be outside step.run because createNetwork.run is async and stateful)
    // Wait, step.run can be wrapped around the network run if network run is deterministic or if we want to memoize it?
    // Inngest steps should be deterministic.
    // However, the original code ran network.run OUTSIDE step.run, then processed inside.
    // To match original behavior for safety:
    const keywordResult = await keywordExtractionNetwork.run(text, { state: keywordState });

    return await step.run(stepId, async () => {
        const data = JSON.parse(keywordResult.state.data.keywordExtractorAgent || "{}");
        const keywords = [
          ...(data.required_skills || []),
          ...(data.preferred_skills || []),
          ...(data.keywords || []),
          ...(data.key_responsibilities || []) 
        ].filter(Boolean);
        const uniqueKeywords = Array.from(new Set(keywords.map((k: string) => k.toLowerCase())));
        
        return {
          extractedData: data,
          keywords: uniqueKeywords
        };
    });
}

/**
 * Calculates the match score between resumes and job keywords.
 */
async function calculateScore(step: any, stepId: string, jobKeywordsList: string[], resumeKeywordsList: string[]) {
    return await step.run(stepId, async () => {
        const jobKeywords = new Set(jobKeywordsList);
        const resumeKeywords = new Set(resumeKeywordsList);
        
        let matchCount = 0;
        const matchedKeywords: string[] = [];
        const missingKeywords: string[] = [];
        
        jobKeywords.forEach(k => {
            if (resumeKeywords.has(k)) {
                matchCount++;
                matchedKeywords.push(k);
            } else {
                missingKeywords.push(k);
            }
        });
        
        const score = jobKeywords.size > 0 ? (matchCount / jobKeywords.size) : 0;
        
        return {
            finalScore: score,
            matchedKeywords,
            missingKeywords,
            totalKeywords: jobKeywords.size
        };
    });
}

/**
 * Helper to flatten structured resume content into a single string for keyword extraction.
 */
function formatResumeContentString(tailoredContent: any): string {
    const getSkillsList = (skills: any): string[] => {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills;
        if (typeof skills === 'object') {
            return Object.values(skills).flat().map(s => String(s));
        }
        return [];
    };

    return [
        tailoredContent.summary || "",
        getSkillsList(tailoredContent.skills).join(", "),
        (Array.isArray(tailoredContent.experience) ? tailoredContent.experience : [])
            .map((e: any) => e.description).join(" "),
    ].join(" ");
}

/**
 * Polishes a cover letter by removing em dashes and common AI filler words/phrases
 * to produce more natural, human-sounding text.
 *
 * @param text - The raw cover letter text returned by the AI agent.
 * @returns The cleaned and polished cover letter text.
 */
function polishCoverLetter(text: string): string {
    // 1. Replace em dashes with a comma-space or regular dash depending on context
    //    e.g. "...skills—communication..." → "...skills, communication..."
    //    We preserve en-dashes and hyphens (e.g. in compound words).
    let polished = text.replace(/\u2014/g, ", "); // em dash → ", "

    // 2. Remove / replace common AI filler words and phrases (case-insensitive)
    const aiWordReplacements: Array<[RegExp, string]> = [
        // Overused openers
        [/\bI am thrilled to\b/gi, "I am eager to"],
        [/\bI am excited to\b/gi, "I am eager to"],
        [/\bI am delighted to\b/gi, "I am eager to"],
        [/\bI am pleased to\b/gi, "I am eager to"],
        [/\bI am deeply passionate about\b/gi, "I am passionate about"],

        // Buzzwords / jargon (each tense handled separately to keep types simple)
        [/\bseamlessly\b/gi, "effectively"],
        [/\bleveraged\b/gi, "used"],
        [/\bleveraging\b/gi, "using"],
        [/\bleverage\b/gi, "use"],
        [/\bsynergy\b/gi, "collaboration"],
        [/\bsynergies\b/gi, "collaborations"],
        [/\bsynergize\b/gi, "collaborate"],
        [/\brobust\b/gi, "strong"],
        [/\bholistic\b/gi, "comprehensive"],
        [/\bparadigm\b/gi, "approach"],
        [/\boptimizing\b/gi, "improving"],
        [/\boptimized\b/gi, "improved"],
        [/\boptimize\b/gi, "improve"],
        [/\butilizing\b/gi, "using"],
        [/\butilized\b/gi, "used"],
        [/\butilize\b/gi, "use"],
        [/\bfacilitating\b/gi, "helping"],
        [/\bfacilitated\b/gi, "helped"],
        [/\bfacilitate\b/gi, "help"],
        [/\bdemonstrated\b/gi, "showed"],
        [/\bdemonstrate\b/gi, "show"],
        [/\bspearheaded\b/gi, "led"],
        [/\bspearheading\b/gi, "leading"],
        [/\bspearhead\b/gi, "lead"],
        [/\bpivotal\b/gi, "key"],
        [/\bgroundbreaking\b/gi, "innovative"],
        [/\bcutting-edge\b/gi, "modern"],
        [/\bstate-of-the-art\b/gi, "modern"],
        [/\bworld-class\b/gi, "high-quality"],
        [/\bthought leadership\b/gi, "expertise"],
        [/\bthought leader\b/gi, "expert"],
        [/\bvalue-added\b/gi, "valuable"],
        [/\bvalue-add\b/gi, "valuable"],
        [/\bimpactful\b/gi, "effective"],
        [/\bdynamic\b/gi, "proactive"],
        [/\binnovative solutions\b/gi, "solutions"],

        // Closing clichés
        [/\bI look forward to discussing[^.]*\./gi, "I welcome the opportunity to discuss this further."],
        [/\bThank you for your consideration\.?/gi, "Thank you for your time."],
        [/\bI am confident that I (?:would|will)\b/gi, "I believe I"],
    ];

    for (const [pattern, replacement] of aiWordReplacements) {
        polished = polished.replace(pattern, replacement as string);
    }

    // 3. Collapse any double spaces or space-before-punctuation artifacts left by replacements
    polished = polished.replace(/ {2,}/g, " ").replace(/ ([,.])/g, "$1");

    return polished.trim();
}

/**
 * Converts JSON resume structure to Markdown.
 */
function jsonToMarkdown(data: any) {
    let md = `# ${data.name || "Tailored Resume"}\n\n`;
    if (data.summary) md += `## Summary\n${data.summary}\n\n`;
    if (data.skills && data.skills.length) md += `## Skills\n${data.skills.join(", ")}\n\n`;
    if (data.experience) {
        md += `## Experience\n`;
        data.experience.forEach((exp: any) => {
            md += `### ${exp.role} at ${exp.company}\n${exp.date || ""}\n${exp.description}\n\n`;
        });
    }
    return md;
}

