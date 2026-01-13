import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import { v4 as uuidv4 } from 'uuid';
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, scoreAgent, skillsExtractorAgent, experienceExtractorAgent, autofixAgent } from "./agents";
import generateChunksAndEmbeddings, { generateEmbedding } from "@/lib/embeddings";

interface AgentState {
  parserAgent:string;
  analyserAgent:string;
  scoreAgent:string;
  skillsExtractorAgent:string;
  experienceExtractorAgent:string;
  autofixAgent:string;
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
    skillsExtractorAgent: "",
    experienceExtractorAgent: "",
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
    skillsExtractorAgent: "",
    experienceExtractorAgent: "",
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
    skillsExtractorAgent: "",
    experienceExtractorAgent: "",
    autofixAgent: ""
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return autofixAgent;
  },
});

// Skills & Experience extraction pipeline (runs after main pipeline)
const extractionPipeline = [skillsExtractorAgent, experienceExtractorAgent];
const extractionNetwork = createNetwork({
  name: 'resume-extraction-network',
  defaultState: createState<AgentState>({
    parserAgent: "",
    analyserAgent: "",
    scoreAgent: "",
    skillsExtractorAgent: "",
    experienceExtractorAgent: "",
    autofixAgent: ""
  }),
  agents: extractionPipeline,
  router: ({ callCount }) => {
    const nextAgent = extractionPipeline[callCount];
    return nextAgent ?? undefined;
  },
});

/**
 *Helper: Extract and embed skills and experience, then persist to DB
 * Optimized to generate embeddings once per section to save costs.
 * Enforces a SINGLE ROW per resume for skills and experience.
 */
async function embedAndSaveSkillsExperience(
  resumeId: string,
  skills: string[],
  certifications: string[],
  experiences: string[]
) {
  try {
    const allSkills = [...skills, ...certifications].filter(Boolean).join(", ");
    const allExperience = experiences.filter(Boolean).join("\n\n");
    console.log(resumeId)
    // Run parallel operations for Skills and Experience
    await Promise.all([
      // 1. Process Skills
      (async () => {
        if (!allSkills) return;
        try {
          const res = await generateChunksAndEmbeddings(allSkills);
          const vector = res.vectorStore[0];
          const formattedVector = `[${vector.join(',')}]`

          if (!vector || vector.length === 0) {
            console.warn(`[embedAndSave] No vector generated for skills. Skipping.`);
            return;
          }

          // Transaction: Delete existing -> Insert New (Text + Vector)
          // Using $executeRaw is safer than Unsafe; Prisma handles array serialization
          await prisma.$executeRaw`
              INSERT INTO "resume_skills" ("id", "resume_id", "skill_text", "embedding")
              VALUES (
                ${uuidv4()}, 
                ${resumeId}, 
                ${allSkills}, 
                ${formattedVector}::vector
              ) ON CONFLICT ("resume_id") 
      DO UPDATE SET 
        "embedding" = EXCLUDED."embedding"
            `
          console.log(`[embedAndSave] Saved single skills row for resume ${resumeId}`);
        } catch (err) {
          console.error(`[embedAndSave] Failed to process skills for ${resumeId}:`, err);
        }
      })(),

      // 2. Process Experience
      (async () => {
        if (!allExperience) return;
        try {
          const res = await generateChunksAndEmbeddings(allExperience);
          const vector = res.vectorStore[0];
          const formattedVector = `[${vector.join(',')}]`

          if (!vector || vector.length === 0) {
            console.warn(`[embedAndSave] No vector generated for experience. Skipping.`);
            return;
          }

          await prisma.$executeRaw`
              INSERT INTO "resume_experience" ("id", "resume_id", "bullet_text", "embedding")
              VALUES (
                ${uuidv4()}, 
                ${resumeId}, 
                ${allExperience}, 
                ${formattedVector}::vector
              ) ON CONFLICT ("resume_id") 
      DO UPDATE SET 
        "embedding" = EXCLUDED."embedding"
            `
          console.log(`[embedAndSave] Saved single experience row for resume ${resumeId}`);
        } catch (err) {
          console.error(`[embedAndSave] Failed to process experience for ${resumeId}:`, err);
        }
      })()
    ]);

  } catch (err) {
    console.error(`[embedAndSave] Fatal error for resume ${resumeId}:`, err);
  }
}

export const resumeCreated = inngest.createFunction(
  { id: "resume-AI-workflow" },
  { event: "app/primary-resume.created" },
  async ({step,event}) => {
    try {
        const resumeText =`
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
                           // If we have an autofix for this section, add it to the FIRST issue (or all, but UI usually expects one)
                           // The prompt was updated to remove autoFix from issues, so strict adherence might mean we attach it differently.
                           // However, the frontend likely uses the `autoFix` property on the issue object.
                           // Let's attach the autofix payload to the issues.
                           
                           if (autofixJson[sectionName] && Array.isArray(issues)) {
                               // Attach the same autofix to all issues in this section, or just the first?
                               // Usually the autofix replaces the WHOLE section, so it applies to the section.
                               // We'll attach it to every issue in that section to be safe for the UI.
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

        const savedResumeId=await step.run("save-resume",async()=>{
        // Update the existing resume with results and status
        const saved = await prisma.resume.update({
          where: {
            id: event.data.resumeId,
            userId: event.data.userId
          },
          data:{
          content:event.data.content,
          extractedData:extractedData,
          analysisData:mergedAnalysisData,
          scoreData:scoreData,
          status: "COMPLETED"
          }
        })
        return saved.id;
        })

        // Run extraction pipeline (skills & experience) after main workflow
        const extractionState = createState<AgentState>({
          parserAgent:"",
          analyserAgent:"",
          scoreAgent:"",
          skillsExtractorAgent:"",
          experienceExtractorAgent:"",
          autofixAgent:""
        })
        
        // FIX: Unwrapped extractionNetwork.run from step.run to avoid NESTING_STEPS error
        const extractionResult = await extractionNetwork.run(resumeText, { state: extractionState });

        // Parse and embed skills/experience
        await step.run("embed-and-save-skills-experience", async () => {
          try {
            const skillsData = JSON.parse(extractionResult.state.data.skillsExtractorAgent || '{}');
            const experienceData = JSON.parse(extractionResult.state.data.experienceExtractorAgent || '{}');
            
            const skills = skillsData.skills || [];
            const certifications = skillsData.certifications || [];
            const experiences = experienceData.experiences || [];

            await embedAndSaveSkillsExperience(savedResumeId, skills, certifications, experiences);
          } catch (err) {
            console.error("[resumeCreated] Failed to parse extraction results:", err);
          }
        });

        // Generate and save full resume embedding
        await step.run("save-full-resume-embedding", async () => {
          try {
            const fullResumeEmbedding = await generateEmbedding(event.data.content);
            const formattedVector = `[${fullResumeEmbedding.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE "resume"
              SET "embedding" = ${formattedVector}::vector
              WHERE "id" = ${savedResumeId}
            `;
          } catch (err) {
            console.error("[resumeCreated] Failed to generate/save full resume embedding:", err);
          }
        });

        return { scoreData, analysisData: mergedAnalysisData } // Final Output
    } catch (error) {
        console.error("Error in resumeCreated workflow:", error);
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
  async ({step,event}) => {
    try {
        let resumeText =`
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
                    prevFixes = JSON.stringify(prev.fixes, null, 2);
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

        await step.run("update-resume",async()=>{
        await prisma.resume.update({
          where:{
            id:event.data.resumeId,
            userId:event.data.userId
          },
          data:{
          name:event.data.name,
          content:event.data.content,
          extractedData:extractedData,
          analysisData:mergedAnalysisData,
          scoreData:scoreData,
          status: "COMPLETED"
          }
        })
        })

        // Run extraction pipeline (skills & experience) after main workflow
        const extractionState = createState<AgentState>({
          parserAgent:"",
          analyserAgent:"",
          scoreAgent:"",
          skillsExtractorAgent:"",
          experienceExtractorAgent:"",
          autofixAgent:""
        })
        
        // FIX: Unwrapped extractionNetwork.run from step.run to avoid NESTING_STEPS error
        const extractionResult = await extractionNetwork.run(resumeText, { state: extractionState });

        // Parse and embed skills/experience
        await step.run("embed-and-save-skills-experience-update", async () => {
          try {
            const skillsData = JSON.parse(extractionResult.state.data.skillsExtractorAgent || '{}');
            const experienceData = JSON.parse(extractionResult.state.data.experienceExtractorAgent || '{}');
            
            const skills = skillsData.skills || [];
            const certifications = skillsData.certifications || [];
            const experiences = experienceData.experiences || [];

            await embedAndSaveSkillsExperience(event.data.resumeId, skills, certifications, experiences);
          } catch (err) {
            console.error("[resumeUpdated] Failed to parse extraction results:", err);
          }
        });

        // Generate and save full resume embedding
        await step.run("update-full-resume-embedding", async () => {
          try {
            const fullResumeEmbedding = await generateEmbedding(event.data.content);
            const formattedVector = `[${fullResumeEmbedding.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE "resume"
              SET "embedding" = ${formattedVector}::vector
              WHERE "id" = ${event.data.resumeId}
            `;
          } catch (err) {
            console.error("[resumeUpdated] Failed to generate/save full resume embedding:", err);
          }
        });

        return { scoreData, analysisData: mergedAnalysisData } // Final Output
    } catch (error) {
        console.error("Error in resumeUpdated workflow:", error);
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