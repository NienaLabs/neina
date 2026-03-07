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


// --- Refactored Master Network Orchestration ---

/**
 * The Resume Orchestrator Network consolidates parsing, analysis, scoring, and autofixing 
 * into a single execution context to prevent Inngest step collisions.
 */
const resumeOrchestratorNetwork = createNetwork({
  name: "resume-orchestrator",
  agents: [parserAgent, analysisAgent, scoreAgent, autofixAgent],
  defaultState: createState<AgentState & { stage: string, autofixInputConstructed: boolean }>({
    parserAgent: "",
    analyserAgent: "",
    scoreAgent: "",
    autofixAgent: "",
    stage: 'ANALYSIS',
    autofixInputConstructed: false,
  }),
  router: ({ network, lastResult }) => {
    const state = network.state.data;

    // Stage Transitions
    if (state.stage === 'ANALYSIS') {
      if (lastResult?.agentName === 'parser-agent' && !state.analyserAgent) {
        return analysisAgent;
      }
      if (lastResult?.agentName === 'analysis-agent') {
        state.stage = 'SCORING';
        // Fallthrough
      } else if (!state.parserAgent) {
        return parserAgent;
      }
    }

    if (state.stage === 'SCORING') {
      if (lastResult?.agentName === 'score-agent') {
        state.stage = 'AUTOFIX';
        // Fallthrough
      } else {
        return scoreAgent;
      }
    }

    if (state.stage === 'AUTOFIX') {
      // Construction of input for autofix (must happen here to be idempotent within the network)
      // Note: In this simple router, we can just return the agent.
      // The agent will see the history including the analysis results.
      if (lastResult?.agentName === 'autofix-agent') {
        state.stage = 'COMPLETED';
        return undefined;
      }
      return autofixAgent;
    }

    return undefined;
  }
});

export const resumeCreated = inngest.createFunction(
  { id: "resume-AI-workflow", concurrency: 1 },
  { event: "app/primary-resume.created" },
  async ({ step, event }) => {
    try {
      // Safety delay for API rate limits
      await step.sleep('rate-limit-cooldown', '10s');
      const resumeText = `#Resume\n${event.data.content}`;

      // Run Consolidated Workflow
      const workflowResult = await resumeOrchestratorNetwork.run(resumeText);
      const finalState = workflowResult.state.data;

      const extractedData = finalState.parserAgent;
      const analysisDataRaw = finalState.analyserAgent;
      const scoreData = finalState.scoreAgent;
      const autofixDataRaw = finalState.autofixAgent;

      // Merge logic for analysis and autofix
      let mergedAnalysisData = analysisDataRaw;
      if (autofixDataRaw && analysisDataRaw) {
        try {
          const analysisJson = JSON.parse(analysisDataRaw);
          const autofixJson = JSON.parse(autofixDataRaw);
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
        } catch (e) {
          console.error("Merge failed:", e);
        }
      }

      const savedResumeId = await step.run("save-resume", async () => {
        const saved = await prisma.resume.update({
          where: { id: event.data.resumeId, userId: event.data.userId },
          data: {
            content: event.data.content,
            extractedData: extractedData ? JSON.parse(extractedData) : undefined,
            analysisData: mergedAnalysisData ? JSON.parse(mergedAnalysisData) : undefined,
            scoreData: scoreData ? JSON.parse(scoreData) : undefined,
            status: "COMPLETED"
          }
        });
        return saved.id;
      });

      // embedding logic stays same
      await step.run("save-keyword-resume-embedding", async () => {
        try {
          const parsedData = JSON.parse(extractedData || '{}');
          const skills = parsedData.additional?.technicalSkills || [];
          const certifications = parsedData.additional?.certificationsTraining || [];
          const jobs = Array.isArray(parsedData.workExperience)
            ? parsedData.workExperience.map((job: any) => job.title).filter(Boolean)
            : [];
          const textToEmbed = [...skills, ...certifications, ...jobs].join(" ");
          const finalEmbedText = textToEmbed || event.data.content;
          const fullResumeEmbedding = await generateEmbedding(finalEmbedText);
          const formattedVector = `[${fullResumeEmbedding.join(',')}]`;
          await prisma.$executeRaw`
            UPDATE "resume"
            SET "embedding" = ${formattedVector}::vector
            WHERE "id" = ${savedResumeId}
          `;
        } catch (err) { console.error("Embedding fail:", err); }
      });

      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, { type: 'RESUME_READY', data: { resumeId: event.data.resumeId } });

      return { scoreData, analysisData: mergedAnalysisData };

    } catch (error) {
      console.error("Error in Master Resume workflow:", error);
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, { type: 'RESUME_FAILED', data: { resumeId: event.data.resumeId } });
      } catch (_) { }
      await step.run("cleanup-failed-resume", async () => {
        await prisma.resume.delete({ where: { id: event.data.resumeId } }).catch(() => { });
      });
      throw error;
    }
  }
);


export const resumeUpdated = inngest.createFunction(
  { id: "resume-updated-workflow", concurrency: 1 },
  { event: "app/resume.updated" },
  async ({ step, event }) => {
    try {
      // Safety delay for API rate limits
      await step.sleep('rate-limit-cooldown', '10s');
      let resumeText = `#Resume\n${event.data.content}\n\n#Targetted Role\n${event.data.role}\n#Job Description\n${event.data.description}`;

      if (event.data.previousAnalysis) {
        let prevFixes = "";
        try {
          const prev = typeof event.data.previousAnalysis === 'string'
            ? JSON.parse(event.data.previousAnalysis)
            : event.data.previousAnalysis;
          if (prev && prev.fixes) {
            const sanitizedFixes: any = {};
            for (const [section, issues] of Object.entries(prev.fixes)) {
              if (Array.isArray(issues)) {
                sanitizedFixes[section] = issues.map((issue: any) => {
                  const { autoFix, ...rest } = issue;
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
          resumeText += `\n\n---------------------------------------------------\n# PREVIOUS ISSUES CHECKLIST (META-DATA)\n${prevFixes}\n---------------------------------------------------`;
        }
      }

      // Run Consolidated Workflow
      const workflowResult = await resumeOrchestratorNetwork.run(resumeText);
      const finalState = workflowResult.state.data;

      const extractedData = finalState.parserAgent;
      const analysisDataRaw = finalState.analyserAgent;
      const scoreData = finalState.scoreAgent;
      const autofixDataRaw = finalState.autofixAgent;

      // Merge logic for analysis and autofix
      let mergedAnalysisData = analysisDataRaw;
      if (autofixDataRaw && analysisDataRaw) {
        try {
          const analysisJson = JSON.parse(analysisDataRaw);
          const autofixJson = JSON.parse(autofixDataRaw);
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
        } catch (e) {
          console.error("Merge failed:", e);
        }
      }

      await step.run("update-resume", async () => {
        await prisma.resume.update({
          where: { id: event.data.resumeId, userId: event.data.userId },
          data: {
            name: event.data.name,
            content: event.data.content,
            extractedData: extractedData ? JSON.parse(extractedData) : undefined,
            analysisData: mergedAnalysisData ? JSON.parse(mergedAnalysisData) : undefined,
            scoreData: scoreData ? JSON.parse(scoreData) : undefined,
            status: "COMPLETED"
          }
        });
      });

      // embedding logic stays same
      await step.run("update-keyword-resume-embedding", async () => {
        try {
          const parsedData = JSON.parse(extractedData || '{}');
          const skills = parsedData.additional?.technicalSkills || [];
          const certifications = parsedData.additional?.certificationsTraining || [];
          const jobs = Array.isArray(parsedData.workExperience)
            ? parsedData.workExperience.map((job: any) => job.title).filter(Boolean)
            : [];
          const textToEmbed = [...skills, ...certifications, ...jobs].join(" ");
          const finalEmbedText = textToEmbed || event.data.content;
          const fullResumeEmbedding = await generateEmbedding(finalEmbedText);
          const formattedVector = `[${fullResumeEmbedding.join(',')}]`;
          await prisma.$executeRaw`
            UPDATE "resume"
            SET "embedding" = ${formattedVector}::vector
            WHERE "id" = ${event.data.resumeId}
          `;
        } catch (err) { console.error("Embedding fail:", err); }
      });

      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, { type: 'RESUME_READY', data: { resumeId: event.data.resumeId } });

      return { scoreData, analysisData: mergedAnalysisData };

    } catch (error) {
      console.error("Error in Master Resume Update workflow:", error);
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, { type: 'RESUME_FAILED', data: { resumeId: event.data.resumeId } });
      } catch (_) { }
      await step.run("reset-status", async () => {
        await prisma.resume.update({
          where: { id: event.data.resumeId },
          data: { status: "COMPLETED" }
        });
      });
      throw error;
    }
  }
);
