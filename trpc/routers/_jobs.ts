import { createTRPCRouter, protectedProcedure } from '../init'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import prisma from '@/lib/prisma'

export const jobsRouter = createTRPCRouter({
  getReccommendedJobs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const OFFSET_VALUE = 0.1 // Adjust this value to compensate for unnecessary embedding data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { selectedTopics: true }
    })

    const selectedTopics = user?.selectedTopics.map(topic => `${topic} jobs`) || [];

   return await prisma.$queryRaw`
  WITH user_resumes AS (
    SELECT id FROM resume WHERE "userId" = ${userId}
  ),
  user_full_embeddings AS (
    SELECT embedding FROM resume WHERE id IN (SELECT id FROM user_resumes) AND embedding IS NOT NULL
  ),
  user_skill_embeddings AS (
    SELECT embedding FROM resume_skills WHERE resume_id IN (SELECT id FROM user_resumes) AND embedding IS NOT NULL
  ),
  user_resp_embeddings AS (
    SELECT embedding FROM resume_experience WHERE resume_id IN (SELECT id FROM user_resumes) AND embedding IS NOT NULL
  ),
  job_overall_similarity AS (
    SELECT 
      j.id AS job_id,
      COALESCE(ROUND(AVG(1 - (j.embedding <=> uf.embedding))::NUMERIC, 3), 0) AS overall_similarity
    FROM jobs j
    LEFT JOIN user_full_embeddings uf ON TRUE
    GROUP BY j.id
  ),
  job_skill_similarity AS (
    SELECT 
      j.id AS job_id,
      COALESCE(ROUND(AVG(1 - (js.embedding <=> us.embedding))::NUMERIC, 3), 0) AS skill_similarity
    FROM jobs j
    LEFT JOIN job_skills js ON js.job_id = j.id AND js.embedding IS NOT NULL
    LEFT JOIN user_skill_embeddings us ON TRUE
    GROUP BY j.id
  ),
  job_resp_similarity AS (
    SELECT 
      j.id AS job_id,
      COALESCE(ROUND(AVG(1 - (jr.embedding <=> ue.embedding))::NUMERIC, 3), 0) AS responsibility_similarity
    FROM jobs j
    LEFT JOIN job_responsibilities jr ON jr.job_id = j.id AND jr.embedding IS NOT NULL
    LEFT JOIN user_resp_embeddings ue ON TRUE
    GROUP BY j.id
  )

  SELECT 
    j.id,
    j.job_title,
    j.employer_name,
    j.employer_logo,
    j.job_apply_link,
    j.job_location,
    j.job_is_remote,
    j.job_description,
    j.job_posted_at,
    COALESCE(j."viewCount", 0) as "viewCount",
    o.overall_similarity,
    s.skill_similarity,
    r.responsibility_similarity,
    ROUND((o.overall_similarity * 0.4 + s.skill_similarity * 0.3 + r.responsibility_similarity * 0.3 + ${OFFSET_VALUE})::NUMERIC, 3) AS total_similarity
  FROM jobs j
  JOIN job_overall_similarity o ON o.job_id = j.id
  JOIN job_skill_similarity s ON s.job_id = j.id
  JOIN job_resp_similarity r ON r.job_id = j.id
  WHERE EXISTS (SELECT 1 FROM user_resumes)
  AND (
    CARDINALITY(${selectedTopics}::text[]) = 0 
    OR j.category = ANY(${selectedTopics}::text[])
  )
  ORDER BY total_similarity DESC
`

  }),

  getJob: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await prisma.jobs.findUnique({
        where: { id: input.id },
        include: {
          job_responsibilities: true,
          job_skills: true,
          recruiterJob: true,
        },
      });

      if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      return job;
    }),

  applyToJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      
      const job = await prisma.jobs.findUnique({
        where: { id: input.jobId },
        include: { recruiterJob: true },
      });

      if (!job || !job.recruiterJob) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This job does not support easy apply.' });
      }

      // Check for existing application by email
      const existing = await prisma.candidatePipeline.findFirst({
          where: {
              recruiterJobId: job.recruiterJob.id,
              candidateEmail: user.email,
          }
      });

      if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'You have already applied to this job.' });
      }

      const application = await prisma.candidatePipeline.create({
        data: {
          recruiterJobId: job.recruiterJob.id,
          candidateName: user.name || 'Candidate',
          candidateEmail: user.email,
          status: 'NEW',
        },
      });

      return { success: true, application };
    }),

  recordView: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        
        // Use a simpler check: if job exists and user hasn't viewed it recently
        const job = await prisma.jobs.findUnique({
            where: { id: input.jobId },
        });

        if (!job) return { success: false };

        // Check if user has viewed this job
        const existingView = await prisma.jobView.findFirst({
            where: {
                jobId: input.jobId,
                userId: userId,
            },
        });

        if (!existingView) {
            await prisma.$transaction([
                prisma.jobView.create({
                    data: {
                        jobId: input.jobId,
                        userId: userId,
                    },
                }),
                prisma.jobs.update({
                    where: { id: input.jobId },
                    data: {
                        viewCount: { increment: 1 },
                    },
                }),
            ]);
            return { success: true, viewed: true };
        }

        return { success: true, viewed: false };
    })
})

export default jobsRouter
