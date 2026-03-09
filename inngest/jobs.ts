/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from './client'
import prisma from '../lib/prisma'
import { fetchJobs } from '../lib/jsearchClient'
import { generateEmbedding } from '../lib/embeddings'
import { createNetwork, createState } from "@inngest/agent-kit";
import { keywordExtractorAgent, jobExtractorAgent } from "./agents";

const jobProcessingOrchestratorNetwork = createNetwork({
  name: "job-processing-orchestrator",
  agents: [jobExtractorAgent, keywordExtractorAgent],
  defaultState: createState({
    stage: 'EXTRACT',
    keywordExtractorAgent: "",
    jobExtractorAgent: "",
  }),
  router: ({ network, lastResult }) => {
    const state = network.state.data;
    if (state.stage === 'EXTRACT' && lastResult?.agentName === 'job-extractor-agent') {
      state.stage = 'KEYWORDS';
      return keywordExtractorAgent;
    }
    if (lastResult?.agentName === 'keyword-extractor-agent') return undefined;
    return jobExtractorAgent;
  }
});

// Helper for type safety and clarity
type JobProcessingState = {
  keywordExtractorAgent: string;
  jobExtractorAgent: string;
  stage: string;
};

type CategoryRow = {
  id: string
  category: string
  location?: string | null
}

type IngestStep = {
  log?: (...args: unknown[]) => Promise<void> | void
  run?: (id: string, fn: () => Promise<any>) => Promise<any>
}

/* env defaults */
const DEFAULT_MAX_PAGES = 1

/**********************
 * Helper: stepLog
 **********************/
async function stepLog(step?: IngestStep, ...args: unknown[]) {
  try {
    if (step?.log) {
      await step.log(...args)
      return
    }
  } catch {
    // ignore step logging errors
  }
  // fallback to console
  console.log('[jsearch-step]', ...args)
}

/**********************
 * Helper: pickCategoryRow - returns category row for a given category_id (or next one)
 **********************/
async function pickCategoryRow(categoryId?: string): Promise<CategoryRow | null> {
  if (categoryId) {
    try {
      const updated = await prisma.job_categories.update({
        where: { id: categoryId },
        data: { last_fetched_at: new Date() },
        select: { id: true, category: true, location: true },
      })
      return updated
    } catch {
      return null
    }
  } else {
    const rows = await prisma.$queryRaw<CategoryRow[]>`
      UPDATE job_categories
      SET last_fetched_at = NOW()
      WHERE id = (
        SELECT id
        FROM job_categories
        WHERE active = true
        ORDER BY COALESCE(last_fetched_at, '1970-01-01') ASC
        LIMIT 1
      )
      RETURNING id, category, location
    `
    return rows?.[0] ?? null
  }
}

/**********************
 * Shared Logic: Job AI Processing
 **********************/
async function runJobAIProcessing(jobId: string, step: any) {
  const job = await step.run('fetch-job-for-ai', async () => {
    return await prisma.jobs.findUnique({ where: { id: jobId } });
  });

  if (!job) return { error: 'Job not found' };

  // 1. Consolidated AI Workflow (Extraction + Keywords)
  const fullJobText = `${job.job_title ?? ''}\n\n${job.job_description ?? ''}`.trim();
  const workflowResult = await jobProcessingOrchestratorNetwork.run(fullJobText);
  const finalData = workflowResult.state.data as JobProcessingState;

  const extractionData = JSON.parse(finalData.jobExtractorAgent || "{}");
  const respBullets = extractionData.responsibilities || [];
  const skillBullets = extractionData.skills || [];

  const keywordData = JSON.parse(finalData.keywordExtractorAgent || "{}");
  const keywordsToEmbed = [
    ...(keywordData.required_skills || []),
    ...(keywordData.preferred_skills || []),
    ...(keywordData.keywords || [])
  ].join(" ");

  // 2. Update Job with extracted data if original was empty
  if (respBullets.length > 0 || skillBullets.length > 0) {
    await step.run('update-job-metadata', async () => {
      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          responsibilities: (job.responsibilities || []).length === 0 ? respBullets : undefined,
          qualifications: (job.qualifications || []).length === 0 ? skillBullets : undefined,
        }
      });
    });
  }

  // 3. Generate and Store Embedding
  let fullJobEmbedding: number[] | null = null;
  if (keywordsToEmbed || fullJobText) {
    fullJobEmbedding = await step.run('embed-job', async () => {
      const textToEmbed = keywordsToEmbed || fullJobText;
      const vector = await generateEmbedding(textToEmbed);
      return (vector && vector.length > 0) ? vector : null;
    });
  }

  if (fullJobEmbedding) {
    await step.run('store-job-embedding', async () => {
      const formattedVector = `[${fullJobEmbedding!.join(',')}]`;
      await prisma.$executeRaw`
              UPDATE "jobs"
              SET "embedding" = ${formattedVector}::vector
              WHERE "id" = ${jobId}
          `;
    });
  }
  return { success: true };
}

/**********************
 * Process Recruiter Job
 **********************/
export const processRecruiterJob = inngest.createFunction(
  { id: 'recruiter-job-processing', concurrency: 1 },
  { event: 'recruiter/job.created' },
  async ({ event, step }) => {
    const { jobId } = event.data;
    if (!jobId) return { error: 'No Job ID provided' };

    // Safety delay to prevent RPM limits
    await step.sleep('rate-limit-cooldown', '15s');

    return await runJobAIProcessing(jobId, step);
  }
);

/**********************
 * Process JSearch Job (Fan-out)
 **********************/
export const processJsearchJob = inngest.createFunction(
  { id: 'jsearch-job-processing', concurrency: 1 }, // Limit concurrency to avoid 429 rate limits
  { event: 'jsearch/job.process' },
  async ({ event, step }) => {
    const { jobId } = event.data;
    if (!jobId) return { error: 'No Job ID provided' };

    // Safety delay to prevent RPM limits
    await step.sleep('rate-limit-cooldown', '20s');

    return await runJobAIProcessing(jobId, step);
  }
);


/**********************
 * Worker: jsearchIngestCategory
 **********************/
export const jsearchIngestCategory = inngest.createFunction(
  { id: 'jsearch.ingest.category' },
  { event: 'jsearch/category.ingest' },
  async ({ event, step }) => {
    const categoryId = event.data.categoryId as string | undefined
    await stepLog(step, `Worker started for category=${categoryId ?? 'auto'}`)

    const row = await step.run('pick-category-row', async () => pickCategoryRow(categoryId))
    if (!row) {
      await stepLog(step, 'no-category-row', categoryId)
      return { skipped: true }
    }

    const category = row.category
    const location = row.location ?? ''
    const maxPages = Number(process.env.JSEARCH_MAX_PAGES_PER_RUN ?? DEFAULT_MAX_PAGES)

    let page = 1

    try {
      for (; page <= maxPages; page++) {
        await stepLog(step, `fetching page=${page} category=${category}`)
        const pageRes: any = await step.run(`fetch-jsearch-page-${page}`, async () => fetchJobs(category, location, page))

        if (!pageRes?.data?.length) {
          await stepLog(step, `no-results page=${page}`)
          break
        }

        const jobItems = pageRes.data
        await stepLog(step, `processing ${jobItems.length} jobs on page=${page}`)

        for (let idx = 0; idx < jobItems.length; idx++) {
          const it = jobItems[idx]

          // Prepare basic job object for initial storing
          const jobForStore = {
            job_publisher: it.job_publisher ?? it.publisher ?? null,
            job_title: it.job_title ?? it.position ?? it.title ?? null,
            employer_name: it.employer_name ?? it.company ?? null,
            employer_logo: it.employer_logo ?? null,
            job_apply_link: it.apply_link ?? it.url ?? it.job_apply_link ?? null,
            job_location: it.job_location ?? null,
            job_description: it.job_description ?? null,
            job_posted_at: it.job_posted_at ?? null,
            job_is_remote: it.job_is_remote ?? it.remote ?? false,
            category: category,
            qualifications: (it.job_highlights?.Qualifications && it.job_highlights.Qualifications.length > 0)
              ? it.job_highlights.Qualifications
              : [],
            responsibilities: (it.job_highlights?.Responsibilities && it.job_highlights.Responsibilities.length > 0)
              ? it.job_highlights.Responsibilities
              : [],
          }

          // Save job row and trigger processing if successful
          const savedJob = await step.run(`save-job-${page}-${idx}`, async () => {
            return await prisma.jobs.create({ data: jobForStore })
          }).catch(err => {
            stepLog(step, 'save-job-error', String(err));
            return null;
          });

          if (savedJob) {
            // Fan-out: Dispatch event for async AI processing
            await step.run(`dispatch-process-event-${page}-${idx}`, async () => {
              await inngest.send({
                name: 'jsearch/job.process',
                data: { jobId: savedJob.id }
              });
            });
          }
        } // end jobs loop
      } // end pages loop
    } catch (err: any) {
      await stepLog(step, 'ingest-failure', String(err))
      return { error: 'failed', message: String(err) }
    }

    await stepLog(step, `Worker finished category=${category}`)
    return { success: true }
  }
);

/**********************
 * Orchestrator: dailyJobFeed
 **********************/
export const dailyJobFeed = inngest.createFunction(
  { id: 'jsearch-daily-feed' },
  { event: 'admin/trigger.job.feed' },
  async ({ step }) => {
    await stepLog(step, 'dailyJobFeed starting')
    const categories = await step.run('fetch-4-categories', async () => {
      return await prisma.job_categories.findMany({
        where: { active: true },
        orderBy: { last_fetched_at: 'asc' },
        select: { id: true, category: true },
        take: 4,
      })
    })

    const cats = categories ?? []
    if (!cats.length) return { count: 0 }

    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i];
      if (i > 0) await step.sleep('wait-1m', '1m');
      await step.run(`trigger-ingest-${cat.id}`, async () => {
        await inngest.send({ name: 'jsearch/category.ingest', data: { categoryId: cat.id } });
      });
    }

    return { triggered: cats.length }
  }
);
