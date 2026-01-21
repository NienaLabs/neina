/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from './client'
import prisma from '../lib/prisma'
import { fetchJobs } from '../lib/jsearchClient'
import { generateEmbedding } from '../lib/embeddings'
import { extractJobDataWithLLM, safeInsertResponsibilityRows, safeInsertSkillRows, generateAndStoreJobEmbeddings as processJobEmbeddings } from '../lib/job-processing';

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
 * Helper: claimNextRun (atomic)
 **********************/
async function claimNextRun(): Promise<{ id: string; category_id: string } | null> {
  const rows: Array<{ id: string; category_id: string }> = await prisma.$queryRaw`
    WITH sel AS (
      SELECT id, category_id FROM job_ingest_runs
      WHERE status = 'scheduled' AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE job_ingest_runs r
    SET status = 'in_progress', started_at = NOW(), attempts = r.attempts + 1
    FROM sel
    WHERE r.id = sel.id
    RETURNING r.id, r.category_id
  `
  return rows?.[0] ?? null
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

    // 3. Generate Full Description Embedding
    const fullJobText = `${job.job_title ?? ''}\n\n${job.job_description ?? ''}`.trim();
    let fullJobEmbedding: number[] | null = null;
    
    if (fullJobText) {
        fullJobEmbedding = await step.run('embed-full-job', async () => {
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

    // 5. Generate & Store Responsibilities
    if (respBullets.length) {
        const respVectors = await step.run('embed-resp', async () => {
             const text = respBullets.join('\n');
             const vector = await generateEmbedding(text);
             return [vector];
        });

        await step.run('store-resp', async () => {
             await safeInsertResponsibilityRows(jobId, respBullets, respVectors);
        });
    }

    // 6. Generate & Store Skills
    if (skillBullets.length) {
        const skillVectors = await step.run('embed-skill', async () => {
             const text = skillBullets.join('\n');
             const vector = await generateEmbedding(text);
             return [vector];
        });

        await step.run('store-skill', async () => {
             await safeInsertSkillRows(jobId, skillBullets, skillVectors);
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

          // Generate full job embedding (Targeting Title + Description only for "Overall" score)
          const fullJobText = `${it.job_title ?? ''}\n\n${it.job_description ?? ''}`.trim();
          let fullJobEmbedding: number[] | null = null;
          
          if (fullJobText) {
            try {
              fullJobEmbedding = await step.run?.(`embed-full-job-${page}-${idx}`, async () => {
                const vector = await generateEmbedding(fullJobText);
                return (vector && vector.length > 0) ? vector : null;
              });
            } catch (err: any) {
              await stepLog(step, 'embed-full-job-error', String(err), { page, idx, title: jobForStore.job_title });
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

          // Compute embeddings (per-job). Use deterministic step name so retries are trackable.
          let respVectors: number[][] = []
          let skillVectors: number[][] = []

          try {
            
            // Generate single vector for all responsibilities
            if (respBullets.length) {
             respVectors = await step.run?.(`embed-resp-${page}-${idx}`, async () => {
                // Join all bullets to form one text for embedding
                const text = respBullets.join('\n');
                const vector = await generateEmbedding(text);
                return [vector]; // Return as array of one vector to match expected type
              })
            }

            // Generate single vector for all skills
            if (skillBullets.length) {
             skillVectors = await step.run?.(`embed-skill-${page}-${idx}`, async () => {
                const text = skillBullets.join('\n');
                const vector = await generateEmbedding(text);
                return [vector]; // Return as array of one vector
              })
              console.log(skillVectors)
            }
          } catch (err: any) {
            await stepLog(step, 'embed-error', String(err), { page, idx, title: jobForStore.job_title })
            // continue to persist job even if embeddings failed
          }

         
          // Persist responsibilities & skills rows one per bullet
          try {
            await step.run?.(`store-resp-${page}-${idx}`, async () => {
              await safeInsertResponsibilityRows(savedJob.id, respBullets, respVectors)
            })
            await step.run?.(`store-skill-${page}-${idx}`, async () => {
              await safeInsertSkillRows(savedJob.id, skillBullets, skillVectors)
            })
          } catch (err: any) {
            await stepLog(step, 'store-embedding-rows-error', String(err), { page, idx, jobId: savedJob.id })
          }

        } // end jobs loop (pageRes.data)
      } // end pages loop
    } catch (err: any) {
      await stepLog(step, 'ingest-failure', String(err))
      // Decide retry vs fail below
      const rowAttempts = await prisma.job_ingest_runs.findUnique({ where: { id: (event.data.runId as string) ?? '' }, select: { attempts: true } }).catch(()=> ({ attempts: 0 }))
      const attempts = rowAttempts?.attempts ?? 0
      if (attempts >= MAX_ATTEMPTS) {
        await prisma.job_ingest_runs.update({
          where: { id: (event.data.runId as string) ?? '' },
          data: { status: 'failed', finished_at: new Date(), notes: String(err) },
        }).catch(()=> null)
        return { error: 'failed', attempts }
      } else {
        const nextAt = new Date(Date.now() + 15 * 60 * 1000)
        await prisma.job_ingest_runs.update({
          where: { id: (event.data.runId as string) ?? '' },
          data: { status: 'scheduled', scheduled_at: nextAt, notes: String(err) },
        }).catch(()=> null)
        return { error: 'rescheduled', nextAt }
      }
    }

    // Completed successfully -> update run
    const result = { created: 1}
    try {
      // Update the run row if we have the run id
      if (event.data.runId) {
        await prisma.job_ingest_runs.update({
          where: { id: event.data.runId },
          data: { status: 'done', finished_at: new Date(), notes: JSON.stringify(result) },
        })
      }
    } catch (err) {
      await stepLog(step, 'update-run-failed', String(err))
    }

    await stepLog(step, `Worker finished category=${category}`, result)
    return result
  }
)

/**********************
 * Daily fanout: pick up to N categories and schedule ingestion runs spaced by 15m
 **********************/
export const dailyJobFeed = inngest.createFunction(
  { id: 'jsearch-daily-feed' },
  { cron: '0 8 * * *', timezone: 'UTC' },
  async ({ step }) => {
    await stepLog(step, 'dailyJobFeed starting')
    const categories = await step.run?.('fetch-4-categories', async () => {
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
      return { scheduled: 0 }
    }

    await step.run?.('scheduling-categories', async () => {
      const offsets = [0, 15, 30, 45]
      const now = new Date()
      const INTERVAL_MIN = 15
      const minutes = now.getUTCMinutes()
      const nextSlotMinutes = Math.ceil(minutes / INTERVAL_MIN) * INTERVAL_MIN
      const deltaToNextMs = (nextSlotMinutes - minutes) * 60 * 1000
      const baseMs = now.getTime() + deltaToNextMs

      let scheduled = 0
      for (const [i, cat] of cats.entries()) {
        const scheduledAt = new Date(baseMs + (offsets[i] ?? 0) * 60 * 1000)
        await prisma.job_ingest_runs.create({
          data: {
            category_id: cat.id,
            scheduled_at: scheduledAt,
            status: 'scheduled',
            notes: `scheduled by dailyJobFeed at ${new Date().toISOString()}`,
          },
        })
        scheduled++
      }
      return { scheduled }
    })

    await stepLog(step, 'dailyJobFeed completed', { scheduled: cats.length })
    return { scheduled: cats.length }
  }
)

/**********************
 * scheduledIngestProcessor:
 * runs every 15 minutes, claims one due run, and invokes the ingest worker
 **********************/
export const scheduledIngestProcessor = inngest.createFunction(
  { id: 'jsearch-scheduled-processor' },
  { cron: '*/15 * * * *', timezone: 'UTC' },
  async ({ step }) => {
    await stepLog(step, 'scheduledIngestProcessor tick')

    // Claim one run atomically
    const run = await step.run?.('claim-next-run', async () => claimNextRun())
    if (!run) {
      await stepLog(step, 'no-due-runs')
      return { claimed: 0, message: 'none-due' }
    }

    await stepLog(step, 'claimed-run', run)

    // Dispatch worker event (fanout) by calling the ingest category function event
    // If your inngest setup expects events, you can trigger the event here; for simplicity,
    // we directly invoke the worker function via inngest client if supported.
    // Otherwise, publish an event with the run id and category id.
    try {
      await inngest.send({
        name: 'jsearch/category.ingest',
        data: { categoryId: run.category_id, runId: run.id },
      })
      await stepLog(step, 'dispatched-worker', { runId: run.id, categoryId: run.category_id })
      return { claimed: 1, runId: run.id }
    } catch (err: any) {
      await stepLog(step, 'dispatch-failed', String(err))
      // revert the run to scheduled so it can be reattempted
      await prisma.job_ingest_runs.update({
        where: { id: run.id },
        data: { status: 'scheduled', notes: `dispatch failed: ${String(err)}` },
      }).catch(()=> null)
      return { claimed: 0, error: 'dispatch_failed' }
    }
  }
)


