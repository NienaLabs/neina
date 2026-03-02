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
      // Safety delay for API rate limits
      await step.sleep('rate-limit-cooldown', '10s');
      const mode = event.data.tailoringMode || "keywords";
      const jobText = event.data.description || "";
      let resumeContent = event.data.content || "";

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
      } catch { /* use as is */ }

      // Run Consolidated Workflow Network
      const initialState = createState({
        stage: 'JOB_KEYWORDS',
        tailoringMode: mode,
        jobText: jobText,
        resumeContent: resumeContent,
        primaryResumeContent: primaryResumeContent,
      });

      const workflowResult = await tailoringOrchestratorNetwork.run(jobText, { state: initialState });
      const finalState = workflowResult.state.data;

      // Extract results from state
      const jobKeywords = [
        ...(finalState.jobKeywordsData.required_skills || []),
        ...(finalState.jobKeywordsData.preferred_skills || []),
        ...(finalState.jobKeywordsData.keywords || []),
        ...(finalState.jobKeywordsData.key_responsibilities || [])
      ].filter(Boolean).map((k: any) => String(k).toLowerCase());
      const uniqueJobKeywords = Array.from(new Set(jobKeywords));

      const tailoredContent = finalState.tailoredContentData;

      const tailoredResumeKeywords = [
        ...(finalState.resumeKeywordsData.required_skills || []),
        ...(finalState.resumeKeywordsData.preferred_skills || []),
        ...(finalState.resumeKeywordsData.keywords || [])
      ].filter(Boolean).map((k: any) => String(k).toLowerCase());
      const uniqueResumeKeywords = Array.from(new Set(tailoredResumeKeywords));

      // Calculate Score
      const scoreData = await step.run("calculate-match-score", async () => {
        const jobKeywordsSet = new Set(uniqueJobKeywords);
        const resumeKeywordsSet = new Set(uniqueResumeKeywords);

        let matchCount = 0;
        const matchedKeywords: string[] = [];
        const missingKeywords: string[] = [];

        jobKeywordsSet.forEach(k => {
          if (resumeKeywordsSet.has(k)) {
            matchCount++;
            matchedKeywords.push(k);
          } else {
            missingKeywords.push(k);
          }
        });

        const score = jobKeywordsSet.size > 0 ? (matchCount / jobKeywordsSet.size) : 0;
        return {
          finalScore: score,
          matchedKeywords,
          missingKeywords,
          totalKeywords: jobKeywordsSet.size
        };
      });

      // Save to DB
      await step.run("save-tailored-resume", async () => {
        const jsonToMarkdown = (data: any) => {
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
        };

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
      const tailoredContentString = event.data.content;

      // Run Consolidated Workflow (Update Mode: Skip Tailoring stage)
      const initialState = createState({
        stage: 'JOB_KEYWORDS',
        skipTailoring: true, // Custom flag for our router
        jobText: jobText,
        resumeContent: tailoredContentString, // Reuse for extraction
        // resumeKeywordsData will be filled by the resume-keyword-proxy
      });

      // We need to slightly adjust the router logic to handle tailoredContentData from resumeContent if skipTailoring
      const workflowResult = await tailoringOrchestratorNetwork.run(jobText, { state: initialState });
      const finalState = workflowResult.state.data;

      // Extract results
      const jobKeywords = [
        ...(finalState.jobKeywordsData.required_skills || []),
        ...(finalState.jobKeywordsData.preferred_skills || []),
        ...(finalState.jobKeywordsData.keywords || [])
      ].filter(Boolean).map((k: any) => String(k).toLowerCase());

      const tailoredResumeKeywords = [
        ...(finalState.resumeKeywordsData.required_skills || []),
        ...(finalState.resumeKeywordsData.preferred_skills || []),
        ...(finalState.resumeKeywordsData.keywords || [])
      ].filter(Boolean).map((k: any) => String(k).toLowerCase());

      // Calculate Score
      const scoreData = await step.run("calculate-match-score-update", async () => {
        const jobKeywordsSet = new Set(jobKeywords);
        const resumeKeywordsSet = new Set(Array.from(new Set(tailoredResumeKeywords)));

        let matchCount = 0;
        const matchedKeywords: string[] = [];
        const missingKeywords: string[] = [];

        jobKeywordsSet.forEach(k => {
          if (resumeKeywordsSet.has(k)) {
            matchCount++;
            matchedKeywords.push(k);
          } else {
            missingKeywords.push(k);
          }
        });

        const score = jobKeywordsSet.size > 0 ? (matchCount / jobKeywordsSet.size) : 0;
        return {
          finalScore: score,
          matchedKeywords,
          missingKeywords,
          totalKeywords: jobKeywordsSet.size
        };
      });

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

      await step.run("save-cover-letter", async () => {
        await prisma.tailoredResume.update({
          where: { id: resumeId },
          data: {
            coverLetter: data.coverLetter || "", // Fallback
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

