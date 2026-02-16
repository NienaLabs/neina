/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from './client'
import prisma from '../lib/prisma'
import { fetchJobs } from '../lib/jsearchClient'
import { generateEmbedding } from '../lib/embeddings'
import { extractJobDataWithLLM, generateAndStoreJobEmbeddings as processJobEmbeddings } from '../lib/job-processing';
import { createNetwork, createState } from "@inngest/agent-kit";
import { keywordExtractorAgent } from "./agents";

const keywordNetwork = createNetwork({
  name: "job-keyword-extraction",
  agents: [keywordExtractorAgent],
  defaultState: createState<{ keywordExtractorAgent: string }>({
    keywordExtractorAgent: ""
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return keywordExtractorAgent;
  }
});

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
const MAX_ATTEMPTS = 3

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
 * This mirrors your earlier behavior of updating last_fetched_at and returning the row.
 **********************/
async function pickCategoryRow(categoryId?: string) : Promise<CategoryRow | null> {
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
    // If no category ID, we pick one. But in the new flow, we always pass ID.
    // Keeping this fallback just in case or for other manual triggers.
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
 * Process Recruiter Job
 * Triggered when a recruiter posts a new job
 **********************/
export const processRecruiterJob = inngest.createFunction(
  { id: 'recruiter-job-processing' },
  { event: 'recruiter/job.created' },
  async ({ event, step }) => {
    const { jobId } = event.data;
    if (!jobId) return { error: 'No Job ID provided' };

    const job = await step.run('fetch-job', async () => {
        return await prisma.jobs.findUnique({ where: { id: jobId } });
    });

    if (!job) return { error: 'Job not found' };

    // 1. Extract Data (outside/before step.run if it uses Agents/steps)
    // We pass the job object which has job_title, job_description etc.
    const { respBullets, skillBullets } = await extractJobDataWithLLM(job);

    // 2. Update Job with extracted data if original was empty
    if (respBullets.length > 0 || skillBullets.length > 0) {
        await step.run('update-job-metadata', async () => {
             // Fetch fresh job to check length inside step or just use what we have? 
             // Using what we have is safer for idempotency if we assume job doesn't change wildly.
             // But prisma update is atomic.
             await prisma.jobs.update({
                 where: { id: jobId },
                 data: {
                     responsibilities: job.responsibilities.length === 0 ? respBullets : undefined,
                     // Map skillBullets to qualifications if empty, to follow JSearch pattern where derived skills might pop up there
                     qualifications: job.qualifications.length === 0 ? skillBullets : undefined, 
                 }
             });
        });
    }

    // 3. Generate Keyword-Focused Embedding
    let fullJobEmbedding: number[] | null = null;
    const fullJobText = `${job.job_title ?? ''}\n\n${job.job_description ?? ''}`.trim();
    
    // Run Keyword Extraction Agent
    const keywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
    const keywordResult = await keywordNetwork.run(fullJobText, { state: keywordState });
    const extractedData = JSON.parse(keywordResult.state.data.keywordExtractorAgent || "{}");
    
    // Construct text for embedding (Keywords + Skills)
    const keywordsToEmbed = [
        ...(extractedData.required_skills || []),
        ...(extractedData.preferred_skills || []),
        ...(extractedData.keywords || [])
    ].join(" ");

    if (keywordsToEmbed) {
        fullJobEmbedding = await step.run('embed-job-keywords', async () => {
            const vector = await generateEmbedding(keywordsToEmbed);
            return (vector && vector.length > 0) ? vector : null;
        });
    } else if (fullJobText) {
        // Fallback to full text if no keywords extracted
         fullJobEmbedding = await step.run('embed-full-job-fallback', async () => {
            const vector = await generateEmbedding(fullJobText);
            return (vector && vector.length > 0) ? vector : null;
        });
    }

    // 4. Store Full Embedding
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



    return { success: true, jobId };
  }
);


/**********************
 * Worker: jsearchIngestCategory
 * Accepts an event with event.data.categoryId and runs the ingest logic for that category
 **********************/
export const jsearchIngestCategory = inngest.createFunction(
  { id: 'jsearch.ingest.category' },
  { event: 'jsearch/category.ingest' },
  async ({ event, step }) => {
    const categoryId = event.data.categoryId as string | undefined
    await stepLog(step, `Worker started for category=${categoryId ?? 'auto'}`)

    // Reuse pickCategoryRow to lock & mark last_fetched_at
    const row = await step.run?.('pick-category-row', async () => pickCategoryRow(categoryId))
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
        let pageRes: any
        try {
          pageRes = await step.run?.(`fetch-jsearch-page-${page}`, async () => fetchJobs(category, location, page))
        } catch (err: any) {
          await stepLog(step, 'fetch-error', String(err))
          if (String(err).includes('rate limited') || String(err).includes('429')) {
            return { error: 'rate_limited' }
          }
          break
        }

        if (!pageRes?.data?.length) {
          await stepLog(step, `no-results page=${page}`)
          break
        }

        // Build bullets lists first (fast, synchronous)
        const jobItems = pageRes.data
        await stepLog(step, `processing ${jobItems.length} jobs on page=${page}`)

        for (let idx = 0; idx < jobItems.length; idx++) {
          const it = jobItems[idx]
          const { respBullets, skillBullets } = await extractJobDataWithLLM(it)

          // Prepare job object for storing (keeps original mapping)
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
            qualifications: it.job_highlights?.Qualifications ?? it.qualifications ?? [],
            responsibilities: it.job_highlights?.Responsibilities ?? it.responsibilities ?? [],
          }

          // Generate Keyword-Focused Embedding
          const fullJobText = `${it.job_title ?? ''}\n\n${it.job_description ?? ''}`.trim();
          let fullJobEmbedding: number[] | null = null;
          
          if (fullJobText) {
            try {
               fullJobEmbedding = await step.run?.(`embed-job-keywords-${page}-${idx}`, async () => {
                  // Run Keyword Agent
                  const keywordState = createState<{ keywordExtractorAgent: string }>({ keywordExtractorAgent: "" });
                  
                  const keywordResult = await keywordNetwork.run(fullJobText, { state: keywordState });
                  const extractedData = JSON.parse(keywordResult.state.data.keywordExtractorAgent || "{}");
                  
                  const keywordsToEmbed = [
                      ...(extractedData.required_skills || []),
                      ...(extractedData.preferred_skills || []),
                      ...(extractedData.keywords || [])
                  ].join(" ");
                  
                  const textToEmbed = keywordsToEmbed || fullJobText;
                  const vector = await generateEmbedding(textToEmbed);
                  return (vector && vector.length > 0) ? vector : null;
              });
            } catch (err: any) {
              await stepLog(step, 'embed-job-keywords-error', String(err), { page, idx, title: jobForStore.job_title });
            }
          }

          // Save job row first
          let savedJob: any
          try {
            savedJob = await step.run?.(`save-job-${page}-${idx}`, async () => {
              return await prisma.jobs.create({ data: jobForStore })
            })
          } catch (err: any) {
            await stepLog(step, 'save-job-error', String(err), { page, idx, title: jobForStore.job_title })
            // skip to next job
            continue
          }

          // Store full job embedding
          if (fullJobEmbedding) {
            try {
              await step.run?.(`store-job-embedding-${page}-${idx}`, async () => {
                const formattedVector = `[${fullJobEmbedding.join(',')}]`;
                await prisma.$executeRaw`
                  UPDATE "jobs"
                  SET "embedding" = ${formattedVector}::vector
                  WHERE "id" = ${savedJob.id}
                `;
              });
            } catch (err: any) {
              await stepLog(step, 'store-job-embedding-error', String(err), { page, idx, jobId: savedJob.id });
            }
          }



        } // end jobs loop (pageRes.data)
      } // end pages loop
    } catch (err: any) {
      await stepLog(step, 'ingest-failure', String(err))
      // Since we removed DB tracking for runs, we just log and return error
      return { error: 'failed', message: String(err) }
    }

    const result = { created: 1}
    await stepLog(step, `Worker finished category=${category}`, result)
    return result
  }
)

/**********************
 * Orchestrator: dailyJobFeed
 * Triggered manually by admin. Fetches categories and triggers ingestion for each, spaced by 15 mins.
 **********************/
export const dailyJobFeed = inngest.createFunction(
  { id: 'jsearch-daily-feed' },
  { event: 'admin/trigger.job.feed' },
  async ({ step }) => {
    await stepLog(step, 'dailyJobFeed starting')
    const categories = await step.run('fetch-4-categories', async () => {
      // Fetch up to 4 categories that haven't been updated recently
      return await prisma.job_categories.findMany({
        where: { active: true },
        orderBy: { last_fetched_at: 'asc' },
        select: { id: true, category: true },
        take: 4,
      })
    })

    const cats = categories ?? []
    if (!cats.length) {
      await stepLog(step, 'no-active-categories')
      return { count: 0 }
    }

    // Orchestrate ingestion with delays
    for (let i = 0; i < cats.length; i++) {
        const cat = cats[i];
        
        // Add delay before next ingestion (except the first one)
        if (i > 0) {
            await step.sleep('wait-15m', '15m');
        }

        await step.run(`trigger-ingest-${cat.id}`, async () => {
             await inngest.send({
                name: 'jsearch/category.ingest',
                data: { categoryId: cat.id },
            })
        });
    }

    await stepLog(step, 'dailyJobFeed completed', { triggered: cats.length })
    return { triggered: cats.length }
  }
)


