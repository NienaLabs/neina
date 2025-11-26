/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from './client'
import prisma from '../lib/prisma'
import { fetchJobs } from '../lib/jsearchClient'
import generateChunksAndEmbeddings from '../lib/embeddings'
import { v4 as uuidv4 } from 'uuid';


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
 * Helper: safeInsertResponsibilityRows
 * Inserts one DB row per chunk & vector; parameterized to avoid SQL injection.
 * Assumes table job_responsibilities(job_id, bullet_text, embedding)
 * and that `embedding` column is pgvector type and accepts a Postgres array literal.
 **********************/
/**********************
 * Helper: safeInsertResponsibilityRows
 * Uses raw SQL to UPSERT text and embeddings in one go.
 * Handles vector(3072) casting.
 **********************/
async function safeInsertResponsibilityRows(jobId: string, bullets: string[], vectors: (number[] | null)[]) {
  if (!bullets || !bullets.length) return;

  const vector = vectors[0];
  if (!vector) return;

  // FIX: format pgvector literal
  const formattedVector = `[${vector.join(',')}]`;

  try {

    await prisma.$executeRaw`
      INSERT INTO "job_responsibilities" ("id", "job_id", "bullet_text", "embedding")
      VALUES (
        ${uuidv4()}, 
        ${jobId}, 
        ${bullets}::text[], 
        ${formattedVector}::vector
      )
      ON CONFLICT ("job_id") 
      DO UPDATE SET 
        "embedding" = EXCLUDED."embedding"
    `;
  } catch (err) {
    console.error(`Failed to upsert responsibilities for job "${jobId}"`, err);
  }
}

/**********************
 * Helper: safeInsertSkillRows
 **********************/
async function safeInsertSkillRows(jobId: string, skills: string[], vectors: (number[] | null)[]) {
  if (!skills || !skills.length) return

  const vector = vectors[0]

  if (!vector) {
    console.log(`[ingest] No vector found for job ${jobId} skills`)
    return
  }
  const formattedVector = `[${vector.join(',')}]`

  try {

    await prisma.$executeRaw`
      INSERT INTO "job_skills" ("id", "job_id", "skill_text", "embedding")
      VALUES (
        ${uuidv4()}, 
        ${jobId}, 
        ${skills}::text[], 
        ${formattedVector}::vector
      )
      ON CONFLICT ("job_id") 
      DO UPDATE SET 
        "embedding" = EXCLUDED."embedding"
    `
  } catch (err) {
    console.error(`Failed to upsert skills for job "${jobId}"`, err)
  }
}
/**********************
 * Helper: normalizeTextCandidates
 * Given a job item, extracts responsibilities and skills arrays (strings)
 **********************/
function extractBulletsFromJob(it: any): { respBullets: string[]; skillBullets: string[] } {
  const respCandidates =
    it.job_highlights?.Responsibilities ??
    it.responsibilities ??
    it.highlights?.responsibilities ??
    null

  const skillCandidates =
    it.job_highlights?.Qualifications ??
    it.qualifications ??
    it.highlights?.qualifications ??
    null

  const respBullets = Array.isArray(respCandidates)
    ? respCandidates.map((r: any) => String(r).trim()).filter(Boolean)
    : typeof respCandidates === 'string'
    ? respCandidates
        .split(/\r?\n|•|\u2022/)
        .map((s: string) => String(s).trim())
        .filter(Boolean)
    : []

  const jobDescription = it.job_description ?? it.description ?? null
  if (jobDescription) {
    const descText = String(jobDescription).trim()
    if (descText && !respBullets.includes(descText)) {
      respBullets.push(descText)
    }
  }

  const skillBullets = Array.isArray(skillCandidates)
    ? skillCandidates.map((s: any) => String(s).trim()).filter(Boolean)
    : typeof skillCandidates === 'string'
    ? skillCandidates
        .split(/\r?\n|,|;|•|\u2022/)
        .map((s: string) => String(s).trim())
        .filter(Boolean)
    : []

  return { respBullets, skillBullets }
}

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
          const { respBullets, skillBullets } = extractBulletsFromJob(it)

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
            qualifications: it.job_highlights?.Qualifications ?? it.qualifications ?? [],
            responsibilities: it.job_highlights?.Responsibilities ?? it.responsibilities ?? [],
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

          // Compute embeddings (per-job). Use deterministic step name so retries are trackable.
          let respVectors: number[][] = []
          let skillVectors: number[][] = []

          try {
            const textsToEmbed = []
            if (respBullets.length) textsToEmbed.push({ kind: 'resp', items: respBullets.slice() })
            if (skillBullets.length) textsToEmbed.push({ kind: 'skill', items: skillBullets.slice() })

            // For clarity: call generateChunksAndEmbeddings for resp and skill separately so we get corresponding vectors
            if (respBullets.length) {
             respVectors = await step.run?.(`embed-resp-${page}-${idx}`, async () => {
                const r = await generateChunksAndEmbeddings(respBullets.join('\n\n'))
                // r.vectorStore expected to be array of vectors corresponding to r.chunks.
                // To keep 1:1 mapping with respBullets we attempt to align; if not possible, fallback to per-bullet embed function.
                const vectors = Array.isArray(r.vectorStore) ? r.vectorStore : []
                return vectors
              })
            }

            if (skillBullets.length) {
             skillVectors = await step.run?.(`embed-skill-${page}-${idx}`, async () => {
                const s = await generateChunksAndEmbeddings(skillBullets.join('\n\n'))
                const vectors = Array.isArray(s.vectorStore) ? s.vectorStore : []
                return vectors
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


