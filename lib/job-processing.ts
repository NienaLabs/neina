import prisma from './prisma';
import generateChunksAndEmbeddings, { generateEmbedding } from './embeddings';
import { v4 as uuidv4 } from 'uuid';
import { jobExtractorAgent } from '@/inngest/agents';
import { createState, createNetwork } from '@inngest/agent-kit';

// Create a network to run the agent properly so that lifecycle hooks work
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





/**********************
 * Helper: extractJobDataWithLLM
 * Combines all job sections and uses LLM to extract skills and responsibilities
 **********************/
export async function extractJobDataWithLLM(it: any): Promise<{ respBullets: string[]; skillBullets: string[] }> {
  // Combine all job sections into one context
  const jobTitle = it.job_title ?? it.position ?? it.title ?? '';
  const jobDescription = it.job_description ?? it.description ?? '';
  const qualifications = Array.isArray(it.job_highlights?.Qualifications)
    ? it.job_highlights.Qualifications.join('\n')
    : Array.isArray(it.qualifications)
    ? it.qualifications.join('\n')
    : '';
  const responsibilities = Array.isArray(it.job_highlights?.Responsibilities)
    ? it.job_highlights.Responsibilities.join('\n')
    : Array.isArray(it.responsibilities)
    ? it.responsibilities.join('\n')
    : '';

  const combinedText = `
# Job Title
${jobTitle}

# Job Description
${jobDescription}

# Qualifications
${qualifications}

# Responsibilities
${responsibilities}
  `.trim();

  // Use LLM to extract structured data
  try {
    const extractionState = createState<{ jobExtractorAgent: string }>({
      jobExtractorAgent: ''
    });
    
    // Run via network to ensure lifecycle hooks populate the state
    const result = await jobExtractionNetwork.run(combinedText, { state: extractionState });
    
    // safely access data
    const rawState = result.state?.data?.jobExtractorAgent;
    const extracted = typeof rawState === 'string' ? JSON.parse(rawState || '{}') : (rawState || {});
    
    return {
      respBullets: extracted.responsibilities || [],
      skillBullets: extracted.skills || []
    };
  } catch (err) {
    console.error('[extractJobDataWithLLM] Error:', err);
    // Fallback to empty arrays
    return { respBullets: [], skillBullets: [] };
  }
}

/**
 * Core function to generate and store all embeddings for a job
 * Can be called from Inngest steps or directly
 */
export async function generateAndStoreJobEmbeddings(jobId: string, jobData: any) {
    try {
        // 1. Extract Structured Data using LLM
        const { respBullets, skillBullets } = await extractJobDataWithLLM(jobData);

        // 2. Generate Full Job Embedding (Title + Desc)
        const fullJobText = `${jobData.job_title ?? ''}\n\n${jobData.job_description ?? ''}`.trim();
        const fullJobEmbedding = await generateEmbedding(fullJobText);

        // 3. Store Full Job Embedding
        if (fullJobEmbedding) {
            const formattedVector = `[${fullJobEmbedding.join(',')}]`;
            await prisma.$executeRaw`
                UPDATE "jobs"
                SET "embedding" = ${formattedVector}::vector
                WHERE "id" = ${jobId}
            `;
        }


         
         return { success: true };

    } catch (error) {
        console.error("Error generating/storing job embeddings:", error);
        throw error;
    }
}
