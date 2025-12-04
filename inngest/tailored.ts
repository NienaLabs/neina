import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent } from "./agents";
import generateChunksAndEmbeddings from "@/lib/embeddings";
import { cosineSimilarity, parseVectorString } from "@/lib/utils";

interface AgentState {
  parserAgent:string;
  analyserAgent:string;
}
const pipeline = [parserAgent, analysisAgent];

const state = createState<AgentState>({
  parserAgent:"",
  analyserAgent:"",
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

export const tailoredResumeCreated = inngest.createFunction(
  { id: "tailored-resume-AI-workflow" },
  { event: "app/tailored-resume.created" },
  async ({step,event}) => {
    const state = createState<AgentState>({
      parserAgent:"",
      analyserAgent:""
    })
    const resumeText =`
    #Resume
    ${event.data.content}
    
    #Targetted Role
    ${event.data.role}
    #Job Description
    ${event.data.description}
    `
    const result = await network.run(resumeText,{state});

    const { jobDescriptionEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
      const { vectorStore } = await generateChunksAndEmbeddings(event.data.description);
      const jobDescriptionEmbedding = vectorStore[0];

      // Fetch skills embedding using raw SQL
      const skillsResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_skills" WHERE "resume_id" = ${event.data.resumeId}
      `;
      console.log('SkillsResult:', skillsResult);
      const skillsEmbedding = parseVectorString(skillsResult[0]?.embedding);
       console.log('skillsEmbedding:',skillsEmbedding)
      // Fetch experience embedding using raw SQL
      const experienceResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_experience" WHERE "resume_id" = ${event.data.resumeId}
      `;
      const experienceEmbedding = parseVectorString(experienceResult[0]?.embedding);

      const skillsScore = skillsEmbedding.length > 0
        ? cosineSimilarity(jobDescriptionEmbedding, skillsEmbedding)
        : 0;
     console.log(skillsScore)
      const experienceScore = experienceEmbedding.length > 0
        ? cosineSimilarity(jobDescriptionEmbedding, experienceEmbedding)
        : 0;
      
      const overallScore = 0.7*skillsScore + 0.3*experienceScore ;

      return {
        jobDescriptionEmbedding,
        scores: {
          skillsScore,
          experienceScore,
          overallScore,
        },
      };
    });

    await step.run("save-tailored-resume", async () => {
      const tailoredResume = await prisma.tailoredResume.create({
        data: {
          name: event.data.name,
          content: event.data.content,
          role: event.data.role,
          jobDescription: event.data.description,
          primaryResumeId: event.data.resumeId,
          userId: event.data.userId,
          extractedData: result.state.data.parserAgent,
          analysisData: result.state.data.analyserAgent,
          scores: {...scores }
        }
      });

      const formattedVector = `[${jobDescriptionEmbedding.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE "tailored_resume"
        SET "jobDescriptionEmbedding" = ${formattedVector}::vector
        WHERE "id" = ${tailoredResume.id}
      `;
    })

    return result 
  }
);
