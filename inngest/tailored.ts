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
      const keywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
      // Execute Agent Network (Must be outside step.run)
      const keywordResult = await keywordExtractionNetwork.run(jobText, { state: keywordState });

      const jobContext = await step.run("process-job-keywords", async () => {
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
         // For now, we'll map it to the Full agent but with a special note or prompt if needed
         // Or strictly, use 'improveResumeEnrichAgent' if I defined it. I did.
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
      // For enrich, we might use FULL for now as a fallback if ENRICH prompt is too complex (interactive)
      // But let's use FULL for enrich too as a "Stronger" tailor, or maybe Nudge but with "add detail" instruction?
      // Actually, let's use IMPROVE_RESUME_PROMPT_FULL for Enrich for now, as the interactive Enrichment flow is not fully implemented.
      if (mode === 'enrich') template = IMPROVE_RESUME_PROMPT_FULL; 

      const truthfulnessRules = CRITICAL_TRUTHFULNESS_RULES_TEMPLATE.replace(
          "{rule_7}",
          "DO NOT fabricate any information."
      );

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
        .replace("{output_language}", "English")
        .replace("{schema}", RESUME_SCHEMA_EXAMPLE);

      // Special handling for Refine/Polish (doesn't strictly need JD/Keywords but safe to include if prompt has placeholders)
      // VALIDATION_POLISH_PROMPT defined in prompts-backend.ts:
      // Review and polish... {critical_truthfulness_rules} ... {original_resume} ... {schema}
      // It DOES NOT have {job_description} or {job_keywords}.
      // So the replace calls above might be no-ops for those placeholders, which is fine.

      const tailorState = createState<any>({ [agentId]: "" });
      const tailorResult = await network.run(filledPrompt, { state: tailorState });

      const tailoredContent = await step.run("process-tailored-content", async () => {
        return JSON.parse(tailorResult.state.data[agentId] || "{}");
      });

      // 3. Extract Keywords from Tailored Resume (for Verification/Scoring)
      const getSkillsList = (skills: any): string[] => {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills;
        if (typeof skills === 'object') {
            return Object.values(skills).flat().map(s => String(s));
        }
        return [];
      };

      const contentString = [
            tailoredContent.summary || "",
            getSkillsList(tailoredContent.skills).join(", "),
            (Array.isArray(tailoredContent.experience) ? tailoredContent.experience : [])
                .map((e: any) => e.description).join(" "),
      ].join(" ");
      
      const tailoredKeywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
      const tailoredKeywordResult = await keywordExtractionNetwork.run(contentString, { state: tailoredKeywordState });

      const tailoredResumeKeywords = await step.run("process-tailored-keywords", async () => {
         const data = JSON.parse(tailoredKeywordResult.state.data.keywordExtractorAgent || "{}");
         const keywords = [
          ...(data.required_skills || []),
          ...(data.preferred_skills || []),
          ...(data.keywords || [])
        ].filter(Boolean);
        return Array.from(new Set(keywords.map((k: string) => k.toLowerCase())));
      });

      // 4. Calculate Word Match Score
      const scoreData = await step.run("calculate-word-match-score", async () => {
          const jobKeywords = new Set(jobContext.keywords);
          const resumeKeywords = new Set(tailoredResumeKeywords);
          
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

      // 5. Save to DB
      await step.run("save-tailored-resume", async () => {
          // Quick JSON-to-Markdown helper
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

      return { success: true, score: scoreData.finalScore };

    } catch (error) {
      console.error("Error in tailoredResumeCreated workflow:", error);
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
  async ({step,event}) => {
    try {
       // 1. Extract Job Keywords
      const jobText = event.data.description || "";
      const keywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
      const keywordResult = await keywordExtractionNetwork.run(jobText, { state: keywordState });

      const jobContext = await step.run("extract-job-keywords-update", async () => {
        const data = JSON.parse(keywordResult.state.data.keywordExtractorAgent || "{}");
        const keywords = [
          ...(data.required_skills || []),
          ...(data.preferred_skills || []),
          ...(data.keywords || [])
        ].filter(Boolean);
        const uniqueKeywords = Array.from(new Set(keywords.map((k: string) => k.toLowerCase())));
        return { extractedData: data, keywords: uniqueKeywords };
      });

      // 2. Tailoring is NOT re-run on simple update unless explicitly requested?
      // The `tailoredResumeUpdated` event usually implies the USER edited the content manually or requested a re-generation.
      // We assume the content in `event.data.content` is the Latest.
      
      const tailoredContentString = event.data.content;

      // 3. Extract Keywords from Current Content (for Scoring)
      const tailoredKeywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
      const tailoredKeywordResult = await keywordExtractionNetwork.run(tailoredContentString, { state: tailoredKeywordState });

      const tailoredResumeKeywords = await step.run("extract-tailored-keywords-update", async () => {
         const data = JSON.parse(tailoredKeywordResult.state.data.keywordExtractorAgent || "{}");
         const keywords = [
          ...(data.required_skills || []),
          ...(data.preferred_skills || []),
          ...(data.keywords || [])
        ].filter(Boolean);
        
        return Array.from(new Set(keywords.map((k: string) => k.toLowerCase())));
      });

      // 4. Calculate Word Match Score
      const scoreData = await step.run("calculate-word-match-score-update", async () => {
          const jobKeywords = new Set(jobContext.keywords);
          const resumeKeywords = new Set(tailoredResumeKeywords);
          
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

      return { success: true, score: scoreData.finalScore };

    } catch (error) {
      console.error("Error in tailoredResumeUpdated workflow:", error);
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
  
          return { success: true };
  
      } catch (error) {
          console.error("Cover letter generation failed", error);
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
