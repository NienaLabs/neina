import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import { v4 as uuidv4 } from 'uuid';
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, scoreAgent, skillsExtractorAgent, experienceExtractorAgent } from "./agents";
import generateChunksAndEmbeddings, { generateEmbedding } from "@/lib/embeddings";

interface AgentState {
  parserAgent:string;
  analyserAgent:string;
  scoreAgent:string;
  skillsExtractorAgent:string;
  experienceExtractorAgent:string;
}

const pipeline = [parserAgent, analysisAgent, scoreAgent];


const state = createState<AgentState>({
  parserAgent:"",
  analyserAgent:"",
  scoreAgent:"",
  skillsExtractorAgent:"",
  experienceExtractorAgent:""
})

const network = createNetwork({
  name:'resume-processing-network',
  defaultState:state,
  agents: pipeline,
  router: ({ callCount }) => {
    // Route strictly based on sequence
    const nextAgent = pipeline[callCount];
    return nextAgent ?? undefined; // Stop when done
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
    experienceExtractorAgent: ""
  }),
  agents: extractionPipeline,
  router: ({ callCount }) => {
    const nextAgent = extractionPipeline[callCount];
    return nextAgent ?? undefined;
  },
});

/**
 * Helper: Extract and embed skills and experience, then persist to DB
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
        const mainState = createState<AgentState>({
          parserAgent:"",
          analyserAgent:"",
          scoreAgent:"",
          skillsExtractorAgent:"",
          experienceExtractorAgent:""
        })
        const resumeText =`
        #Resume
        ${event.data.content}
        `
        // Run through the network (parser → analysis → score)
        const result = await network.run(resumeText,{state: mainState});
        const savedResumeId=await step.run("save-resume",async()=>{
        // Update the existing resume with results and status
        const saved = await prisma.resume.update({
          where: {
            id: event.data.resumeId,
            userId: event.data.userId
          },
          data:{
          content:event.data.content,
          extractedData:result.state.data.parserAgent,
          analysisData:result.state.data.analyserAgent,
          scoreData:result.state.data.scoreAgent,
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
          experienceExtractorAgent:""
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

        return result // Final stage (scoreAgent) output
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
        const mainState = createState<AgentState>({
          parserAgent:"",
          analyserAgent:"",
          scoreAgent:"",
          skillsExtractorAgent:"",
          experienceExtractorAgent:""
        })
        const resumeText =`
        #Resume
        ${event.data.content}
        
        #Targetted Role
        ${event.data.role}
        #Job Description
        ${event.data.description}
        `
        // Run through the network (parser → analysis → score)
        const result = await network.run(resumeText,{state: mainState});
        await step.run("update-resume",async()=>{
        await prisma.resume.update({
          where:{
            id:event.data.resumeId,
            userId:event.data.userId
          },
          data:{
          name:event.data.name,
          content:event.data.content,
          extractedData:result.state.data.parserAgent,
          analysisData:result.state.data.analyserAgent,
          scoreData:result.state.data.scoreAgent,
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
          experienceExtractorAgent:""
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

        return result // Final stage (scoreAgent) output
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