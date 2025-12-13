import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, jobExtractorAgent } from "./agents";
import { generateEmbedding } from "@/lib/embeddings";
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

const jobExtractionNetwork = createNetwork({
  name: 'job-extraction-network',
  agents: [jobExtractorAgent],
  defaultState: createState<{ jobExtractorAgent: string }>({
    jobExtractorAgent: ''
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return jobExtractorAgent;
  }
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

    // Extract skills and responsibilities (Moved out of step.run to avoid NESTING_STEPS)
    let extractedSkills: string[] = [];
    let extractedResponsibilities: string[] = [];
    try {
      const extractionState = createState<{ jobExtractorAgent: string }>({
        jobExtractorAgent: ''
      });
      const extractionResult = await jobExtractionNetwork.run(event.data.description, { state: extractionState });
      const extracted = JSON.parse(extractionResult.state.data.jobExtractorAgent || '{}');
      extractedSkills = extracted.skills || [];
      extractedResponsibilities = extracted.responsibilities || [];
    } catch (err) {
      console.error('[tailoredResumeCreated] Failed to extract job data with LLM:', err);
    }

    const { jobDescriptionEmbedding, jobSkillsEmbedding, jobResponsibilitiesEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
      // Generate embeddings for job description, skills, and responsibilities
      const jobDescriptionEmbedding = await generateEmbedding(event.data.description);
      const jobSkillsEmbedding = extractedSkills.length > 0
        ? await generateEmbedding(extractedSkills.join('\n'))
        : [];
      const jobResponsibilitiesEmbedding = extractedResponsibilities.length > 0
        ? await generateEmbedding(extractedResponsibilities.join('\n'))
        : [];

      // Fetch full resume embedding
      const fullResumeResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume" WHERE "id" = ${event.data.resumeId}
      `;
      const fullResumeEmbedding = parseVectorString(fullResumeResult[0]?.embedding);

      // Fetch skills and experience embeddings from resume
      const skillsResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_skills" WHERE "resume_id" = ${event.data.resumeId}
      `;
      const skillsEmbedding = parseVectorString(skillsResult[0]?.embedding);

      const experienceResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_experience" WHERE "resume_id" = ${event.data.resumeId}
      `;
      const experienceEmbedding = parseVectorString(experienceResult[0]?.embedding);

      // Calculate scores
      const overallScore = fullResumeEmbedding.length > 0 && jobDescriptionEmbedding.length > 0
        ? cosineSimilarity(fullResumeEmbedding, jobDescriptionEmbedding)
        : 0;

      const skillsScore = skillsEmbedding.length > 0 && jobSkillsEmbedding.length > 0
        ? cosineSimilarity(skillsEmbedding, jobSkillsEmbedding)
        : 0;

      const experienceScore = experienceEmbedding.length > 0 && jobResponsibilitiesEmbedding.length > 0
        ? cosineSimilarity(experienceEmbedding, jobResponsibilitiesEmbedding)
        : 0;
      
      // Weighted final score: 0.4*overall + 0.3*skills + 0.3*experience
      const finalScore = 0.4 * overallScore + 0.3 * skillsScore + 0.3 * experienceScore;

      return {
        jobDescriptionEmbedding,
        jobSkillsEmbedding,
        jobResponsibilitiesEmbedding,
        scores: {
          overallScore,
          skillsScore,
          experienceScore,
          finalScore,
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

      const formattedJobDescVector = `[${jobDescriptionEmbedding.join(',')}]`;
      const formattedSkillsVector = jobSkillsEmbedding.length > 0 ? `[${jobSkillsEmbedding.join(',')}]` : null;
      const formattedRespVector = jobResponsibilitiesEmbedding.length > 0 ? `[${jobResponsibilitiesEmbedding.join(',')}]` : null;
      
      if (formattedSkillsVector && formattedRespVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobSkillsEmbedding" = ${formattedSkillsVector}::vector,
              "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
          WHERE "id" = ${tailoredResume.id}
        `;
      } else if (formattedSkillsVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobSkillsEmbedding" = ${formattedSkillsVector}::vector
          WHERE "id" = ${tailoredResume.id}
        `;
      } else if (formattedRespVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
          WHERE "id" = ${tailoredResume.id}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector
          WHERE "id" = ${tailoredResume.id}
        `;
      }
    })

    return result 
  }
);

export const tailoredResumeUpdated = inngest.createFunction(
  { id: "tailored-resume-updated-workflow" },
  { event: "app/tailored-resume.updated" },
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

    // Extract skills and responsibilities (Moved out of step.run to avoid NESTING_STEPS)
    let extractedSkills: string[] = [];
    let extractedResponsibilities: string[] = [];
    try {
      const extractionState = createState<{ jobExtractorAgent: string }>({
        jobExtractorAgent: ''
      });
      const extractionResult = await jobExtractionNetwork.run(event.data.description, { state: extractionState });
      const extracted = JSON.parse(extractionResult.state.data.jobExtractorAgent || '{}');
      extractedSkills = extracted.skills || [];
      extractedResponsibilities = extracted.responsibilities || [];
    } catch (err) {
      console.error('[tailoredResumeUpdated] Failed to extract job data with LLM:', err);
    }

    const { jobDescriptionEmbedding, jobSkillsEmbedding, jobResponsibilitiesEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
      // Generate embeddings for job description, skills, and responsibilities
      const jobDescriptionEmbedding = await generateEmbedding(event.data.description);
      const jobSkillsEmbedding = extractedSkills.length > 0
        ? await generateEmbedding(extractedSkills.join('\n'))
        : [];
      const jobResponsibilitiesEmbedding = extractedResponsibilities.length > 0
        ? await generateEmbedding(extractedResponsibilities.join('\n'))
        : [];

      // Fetch full resume embedding (from primary resume)
      const fullResumeResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume" WHERE "id" = ${event.data.primaryResumeId}
      `;
      const fullResumeEmbedding = parseVectorString(fullResumeResult[0]?.embedding);
      
      // Fetch skills and experience embeddings from primary resume
      const skillsResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_skills" WHERE "resume_id" = ${event.data.primaryResumeId}
      `;
      const skillsEmbedding = parseVectorString(skillsResult[0]?.embedding);
      
      const experienceResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_experience" WHERE "resume_id" = ${event.data.primaryResumeId}
      `;
      const experienceEmbedding = parseVectorString(experienceResult[0]?.embedding);

      // Calculate scores
      const overallScore = fullResumeEmbedding.length > 0 && jobDescriptionEmbedding.length > 0
        ? cosineSimilarity(fullResumeEmbedding, jobDescriptionEmbedding)
        : 0;

      const skillsScore = skillsEmbedding.length > 0 && jobSkillsEmbedding.length > 0
        ? cosineSimilarity(skillsEmbedding, jobSkillsEmbedding)
        : 0;
      
      const experienceScore = experienceEmbedding.length > 0 && jobResponsibilitiesEmbedding.length > 0
        ? cosineSimilarity(experienceEmbedding, jobResponsibilitiesEmbedding)
        : 0;
      
      // Weighted final score: 0.4*overall + 0.3*skills + 0.3*experience
      const finalScore = 0.4 * overallScore + 0.3 * skillsScore + 0.3 * experienceScore;

      return {
        jobDescriptionEmbedding,
        jobSkillsEmbedding,
        jobResponsibilitiesEmbedding,
        scores: {
          overallScore,
          skillsScore,
          experienceScore,
          finalScore,
        },
      };
    });

    await step.run("update-tailored-resume", async () => {
      await prisma.tailoredResume.update({
        where: {
            id: event.data.resumeId,
            userId: event.data.userId
        },
        data: {
          name: event.data.name,
          content: event.data.content,
          role: event.data.role,
          jobDescription: event.data.description,
          extractedData: result.state.data.parserAgent,
          analysisData: result.state.data.analyserAgent,
          scores: {...scores }
        }
      });

      const formattedJobDescVector = `[${jobDescriptionEmbedding.join(',')}]`;
      const formattedSkillsVector = jobSkillsEmbedding.length > 0 ? `[${jobSkillsEmbedding.join(',')}]` : null;
      const formattedRespVector = jobResponsibilitiesEmbedding.length > 0 ? `[${jobResponsibilitiesEmbedding.join(',')}]` : null;
      
      if (formattedSkillsVector && formattedRespVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobSkillsEmbedding" = ${formattedSkillsVector}::vector,
              "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      } else if (formattedSkillsVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobSkillsEmbedding" = ${formattedSkillsVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      } else if (formattedRespVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      }
    })

    return result 
  }
);
