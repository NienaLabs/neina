import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import { v4 as uuidv4 } from 'uuid';
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, scoreAgent, autofixAgent } from "./agents";
import { generateEmbedding } from "@/lib/embeddings";

interface AgentState {
  parserAgent: string;
  analyserAgent: string;
  scoreAgent: string;
  autofixAgent: string;
}

// 1. Analysis Network (Parser + Analysis) -> Finds issues
const analysisPipeline = [parserAgent, analysisAgent];
const analysisNetwork = createNetwork({
  name: 'resume-analysis-network',
  agents: analysisPipeline,
  defaultState: createState<AgentState>({
    parserAgent: "",
    analyserAgent: "",
    scoreAgent: "",
    autofixAgent: ""
  }),
  router: ({ callCount }) => {
    const nextAgent = analysisPipeline[callCount];
    return nextAgent ?? undefined;
  },
});

// 2. Score Network (Scorer Only) -> Scores resume (CLEAN CONTEXT)
const scoreNetwork = createNetwork({
  name: 'resume-score-network',
  agents: [scoreAgent],
  defaultState: createState<AgentState>({
    parserAgent: "",
    analyserAgent: "",
    scoreAgent: "",
    autofixAgent: ""
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return scoreAgent;
  },
});

// 3. Autofix Network (Autofix Only) -> Generates fixes based on issues
const autofixNetwork = createNetwork({
  name: 'resume-autofix-network',
  agents: [autofixAgent],
  defaultState: createState<AgentState>({
    parserAgent: "",
    analyserAgent: "",
    scoreAgent: "",
    autofixAgent: ""
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return autofixAgent;
  },
});

export const resumeCreated = inngest.createFunction(
  { id: "resume-AI-workflow" },
  { event: "app/primary-resume.created" },
  async ({ step, event }) => {
    try {
      const resumeText = `
        #Resume
        ${event.data.content}
        `

      // 1. Run Analysis (Find Issues)
      const analysisResult = await analysisNetwork.run(resumeText);
      const extractedData = analysisResult.state.data.parserAgent;
      const analysisDataRaw = analysisResult.state.data.analyserAgent;

      // 2. Run Scoring (Clean Context)
      const scoreResult = await scoreNetwork.run(resumeText);
      const scoreData = scoreResult.state.data.scoreAgent;

      // 3. Run Autofix (Using Issues from Analysis)
      let mergedAnalysisData = analysisDataRaw;

      // Only run autofix if we have analysis data
      if (analysisDataRaw) {
        try {
          // Construct prompt for Autofix Agent
          const autofixInput = `
                ${resumeText}

                ---------------------------------------------------
                # ANALYZED ISSUES
                ${analysisDataRaw}
                ---------------------------------------------------
                `;

          const autofixResult = await autofixNetwork.run(autofixInput);
          const autofixDataRaw = autofixResult.state.data.autofixAgent;

          // MERGE LOGIC: Inject autoFix values back into analysisData
          if (autofixDataRaw && analysisDataRaw) {
            const analysisJson = JSON.parse(analysisDataRaw);
            const autofixJson = JSON.parse(autofixDataRaw);

            // Iterate through sections in analysis (fixes)
            if (analysisJson.fixes) {
              for (const [sectionName, issues] of Object.entries(analysisJson.fixes)) {
                if (autofixJson[sectionName] && Array.isArray(issues)) {
                  (issues as any[]).forEach(issue => {
                    issue.autoFix = autofixJson[sectionName];
                  });
                }
              }
            }
            mergedAnalysisData = JSON.stringify(analysisJson);
          }
        } catch (e) {
          console.error("Autofix generation failed:", e);
          // Continue without autofixes
        }
      }

      const savedResumeId = await step.run("save-resume", async () => {
        // Update the existing resume with results and status
        const saved = await prisma.resume.update({
          where: {
            id: event.data.resumeId,
            userId: event.data.userId
          },
          data: {
            content: event.data.content,
            extractedData: extractedData,
            analysisData: mergedAnalysisData,
            scoreData: scoreData,
            status: "COMPLETED"
          }
        })
        return saved.id;
      })

      // Generate and save resume embedding (Keywords Only)
      await step.run("save-keyword-resume-embedding", async () => {
        try {
          // Use the parsed data from the main pipeline (parserAgent)
          const parsedData = JSON.parse(extractedData || '{}');
          
          const skills = parsedData.additional?.technicalSkills || [];
          const certifications = parsedData.additional?.certificationsTraining || [];
          const jobs = Array.isArray(parsedData.workExperience) 
            ? parsedData.workExperience.map((job: any) => job.title).filter(Boolean)
            : [];

          const textToEmbed = [...skills, ...certifications, ...jobs].join(" ");
          const finalEmbedText = textToEmbed || event.data.content; // Fallback

          const fullResumeEmbedding = await generateEmbedding(finalEmbedText);
          const formattedVector = `[${fullResumeEmbedding.join(',')}]`;
          await prisma.$executeRaw`
            UPDATE "resume"
            SET "embedding" = ${formattedVector}::vector
            WHERE "id" = ${savedResumeId}
          `;
        } catch (err) {
          console.error("[resumeCreated] Failed to generate/save keyword resume embedding:", err);
        }
      });

      // Notify client via SSE that resume processing is complete
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'RESUME_READY',
        data: { resumeId: event.data.resumeId }
      });

      return { scoreData, analysisData: mergedAnalysisData } // Final Output
    } catch (error) {
      console.error("Error in resumeCreated workflow:", error);
      // Notify client via SSE that resume processing failed
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'RESUME_FAILED',
          data: { resumeId: event.data.resumeId }
        });
      } catch (_) { /* best-effort */ }
      // Delete the resume since creation failed
      await step.run("delete-failed-resume", async () => {
        await prisma.resume.delete({
          where: { id: event.data.resumeId }
        });
      });
      throw error; // Re-throw to ensure Inngest registers the failure
    }
  }
);

export const resumeUpdated = inngest.createFunction(
  { id: "resume-updated-workflow" },
  { event: "app/resume.updated" },
  async ({ step, event }) => {
    try {
      let resumeText = `
        #Resume
        ${event.data.content}
        
        #Targetted Role
        ${event.data.role}
        #Job Description
        ${event.data.description}
        `

      if (event.data.previousAnalysis) {
        let prevFixes = "";
        try {
          const prev = typeof event.data.previousAnalysis === 'string'
            ? JSON.parse(event.data.previousAnalysis)
            : event.data.previousAnalysis;
          if (prev && prev.fixes) {
            // Sanitize prev.fixes to remove massive 'autoFix' content from legacy data
            const sanitizedFixes: any = {};
            for (const [section, issues] of Object.entries(prev.fixes)) {
              if (Array.isArray(issues)) {
                sanitizedFixes[section] = issues.map((issue: any) => {
                  const { autoFix, ...rest } = issue; // Destructure to exclude autoFix
                  return rest;
                });
              } else {
                sanitizedFixes[section] = issues;
              }
            }
            prevFixes = JSON.stringify(sanitizedFixes, null, 2);
          }
        } catch (e) {
          console.error("Failed to parse previous analysis", e);
        }

        if (prevFixes) {
          resumeText += `
        
        ---------------------------------------------------
        # PREVIOUS ISSUES CHECKLIST (META-DATA)
        The following is a list of issues found in a PREVIOUS version of this resume.
        YOUR GOAL: Check if these specific issues have been fixed in the CURRENT RESUME content above.
        - If an issue is fixed, IGNORE it.
        - If an issue is NOT fixed, Re-report it.
        - DO NOT hallucinate that these issues exist if the current text shows they are fixed.
        
        ${prevFixes}
        ---------------------------------------------------
                 `
        }
      }

      // 1. Run Analysis (Find Issues)
      const analysisResult = await analysisNetwork.run(resumeText);
      const extractedData = analysisResult.state.data.parserAgent;
      const analysisDataRaw = analysisResult.state.data.analyserAgent;

      // 2. Run Scoring (Clean Context)
      const scoreResult = await scoreNetwork.run(resumeText);
      const scoreData = scoreResult.state.data.scoreAgent;

      // 3. Run Autofix (Using Issues from Analysis)
      let mergedAnalysisData = analysisDataRaw;

      // Only run autofix if we have analysis data
      if (analysisDataRaw) {
        try {
          // Construct prompt for Autofix Agent
          const autofixInput = `
                ${resumeText}

                ---------------------------------------------------
                # ANALYZED ISSUES
                ${analysisDataRaw}
                ---------------------------------------------------
                `;

          const autofixResult = await autofixNetwork.run(autofixInput);
          const autofixDataRaw = autofixResult.state.data.autofixAgent;

          // MERGE LOGIC: Inject autoFix values back into analysisData
          if (autofixDataRaw && analysisDataRaw) {
            const analysisJson = JSON.parse(analysisDataRaw);
            const autofixJson = JSON.parse(autofixDataRaw);

            // Iterate through sections in analysis (fixes)
            if (analysisJson.fixes) {
              for (const [sectionName, issues] of Object.entries(analysisJson.fixes)) {
                if (autofixJson[sectionName] && Array.isArray(issues)) {
                  (issues as any[]).forEach(issue => {
                    issue.autoFix = autofixJson[sectionName];
                  });
                }
              }
            }
            mergedAnalysisData = JSON.stringify(analysisJson);
          }
        } catch (e) {
          console.error("Autofix generation failed:", e);
          // Continue without autofixes
        }
      }

      await step.run("update-resume", async () => {
        await prisma.resume.update({
          where: {
            id: event.data.resumeId,
            userId: event.data.userId
          },
          data: {
            name: event.data.name,
            content: event.data.content,
            extractedData: extractedData,
            analysisData: mergedAnalysisData,
            scoreData: scoreData,
            status: "COMPLETED"
          }
        })
      })

      // Generate and save resume embedding (Keywords Only)
      await step.run("update-keyword-resume-embedding", async () => {
        try {
           // Use the parsed data from the main pipeline (parserAgent)
           const parsedData = JSON.parse(extractedData || '{}');
          
           const skills = parsedData.additional?.technicalSkills || [];
           const certifications = parsedData.additional?.certificationsTraining || [];
           const jobs = Array.isArray(parsedData.workExperience) 
             ? parsedData.workExperience.map((job: any) => job.title).filter(Boolean)
             : [];
 
           const textToEmbed = [...skills, ...certifications, ...jobs].join(" ");
           const finalEmbedText = textToEmbed || event.data.content; // Fallback

          const fullResumeEmbedding = await generateEmbedding(finalEmbedText);
          const formattedVector = `[${fullResumeEmbedding.join(',')}]`;
          await prisma.$executeRaw`
            UPDATE "resume"
            SET "embedding" = ${formattedVector}::vector
            WHERE "id" = ${event.data.resumeId}
          `;
        } catch (err) {
          console.error("[resumeUpdated] Failed to generate/save keyword resume embedding:", err);
        }
      });

      // Notify client via SSE that resume re-analysis is complete
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'RESUME_READY',
        data: { resumeId: event.data.resumeId }
      });

      return { scoreData, analysisData: mergedAnalysisData } // Final Output
    } catch (error) {
      console.error("Error in resumeUpdated workflow:", error);
      // Notify client via SSE that resume re-analysis failed
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'RESUME_FAILED',
          data: { resumeId: event.data.resumeId }
        });
      } catch (_) { /* best-effort */ }
      // Reset status to COMPLETED to preserve old analysis data
      await step.run("reset-resume-status", async () => {
        await prisma.resume.update({
          where: { id: event.data.resumeId },
          data: { status: "COMPLETED" }
        });
      });
      throw error;
    }
  }
);