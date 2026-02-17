import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { keywordExtractorAgent, improveResumeNudgeAgent, improveResumeKeywordsAgent, improveResumeFullAgent, improveResumeRefineAgent, improveResumeEnrichAgent, coverLetterAgent } from "./agents";
import { getTailoringPrompt, COVER_LETTER_PROMPT } from "@/constants/prompts";
import { IMPROVE_RESUME_PROMPT_NUDGE, IMPROVE_RESUME_PROMPT_KEYWORDS, IMPROVE_RESUME_PROMPT_FULL, VALIDATION_POLISH_PROMPT, CRITICAL_TRUTHFULNESS_RULES_TEMPLATE, RESUME_SCHEMA_EXAMPLE } from "@/constants/prompts-backend";




const keywordExtractionNetwork = createNetwork({
  name: "tailored-keyword-extraction",
  agents: [keywordExtractorAgent],
  defaultState: createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return keywordExtractorAgent;
  }
});

const nudgeTailoringNetwork = createNetwork({
  name: "tailored-nudge-network",
  agents: [improveResumeNudgeAgent],
  defaultState: createState<{ improveResumeNudgeAgent: string }>({ improveResumeNudgeAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return improveResumeNudgeAgent;
  }
});

const keywordsTailoringNetwork = createNetwork({
  name: "tailored-keywords-network",
  agents: [improveResumeKeywordsAgent],
  defaultState: createState<{ improveResumeKeywordsAgent: string }>({ improveResumeKeywordsAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return improveResumeKeywordsAgent;
  }
});

const fullTailoringNetwork = createNetwork({
  name: "tailored-full-network",
  agents: [improveResumeFullAgent],
  defaultState: createState<{ improveResumeFullAgent: string }>({ improveResumeFullAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return improveResumeFullAgent;
  }
});

const refineTailoringNetwork = createNetwork({
    name: "tailored-refine-network",
    agents: [improveResumeRefineAgent],
    defaultState: createState<{ improveResumeRefineAgent: string }>({ improveResumeRefineAgent: "" }),
    router: ({ callCount }) => {
      if (callCount > 0) return undefined;
      return improveResumeRefineAgent;
    }
  });
  
  const enrichTailoringNetwork = createNetwork({
    name: "tailored-enrich-network",
    agents: [improveResumeEnrichAgent],
    defaultState: createState<{ improveResumeEnrichAgent: string }>({ improveResumeEnrichAgent: "" }),
    router: ({ callCount }) => {
      if (callCount > 0) return undefined;
      return improveResumeEnrichAgent;
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
  { id: "tailored-resume-AI-workflow" },
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

      // Fetch Primary Resume Content if needed for verification (Refine mode)
      let primaryResumeContent = "";
      if (mode === 'refine' && event.data.primaryResumeId) {
          const primaryResume = await prisma.resume.findUnique({
              where: { id: event.data.primaryResumeId },
              select: { content: true }
          });
          if (primaryResume) {
              primaryResumeContent = primaryResume.content;
          }
      }

      // Parse the content - it might be a JSON string (from retailor) or plain text
      let resumeContent = event.data.content || "";
      try {
        // If it's a JSON string, parse it back to object then stringify it nicely
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

      // 5. Save to DB
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

      // Notify client via SSE that tailored resume is ready
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
      console.error("Error in tailoredResumeCreated workflow:", error);
      // Notify client via SSE that tailored resume processing failed
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
      await step.run("delete-failed-tailored-resume", async () => {
        await prisma.tailoredResume.delete({
          where: { id: event.data.resumeId }
        });
      });
      throw error;
    }
  }
);

export const tailoredResumeUpdated = inngest.createFunction(
  { id: "tailored-resume-updated-workflow" },
  { event: "app/tailored-resume.updated" },
  async ({ step, event }) => {
    try {
       // 1. Extract Job Keywords
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

      // 5. Save to DB
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

      // Notify client via SSE that tailored resume update is ready
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'TAILORED_RESUME_READY',
        data: { resumeId: event.data.resumeId }
      });

      return { success: true, score: scoreData.finalScore };

    } catch (error) {
      console.error("Error in tailoredResumeUpdated workflow:", error);
      // Notify client via SSE that tailored resume update failed
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'TAILORED_RESUME_FAILED',
          data: { resumeId: event.data.resumeId }
        });
      } catch (_) { /* best-effort */ }
       await step.run("reset-resume-status", async () => {
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
    { id: "cover-letter-generation-workflow" },
    { event: "app/cover-letter.generation-requested" },
    async ({ step, event }) => {
      try {
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

