import { createTRPCRouter, protectedProcedure } from '../init'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import prisma from '@/lib/prisma'

export const jobsRouter = createTRPCRouter({
  getReccommendedJobs: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(15),
      searchTerm: z.string().optional(),
      filterRemote: z.enum(['all', 'remote', 'onsite']).default('all'),
      sortBy: z.enum(['match', 'recent']).default('match'),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, searchTerm, filterRemote, sortBy } = input;
      const skip = (page - 1) * limit;
      const userId = ctx.session.user.id;
      const OFFSET_VALUE = 0.1;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { selectedTopics: true }
      });

      const selectedTopics = user?.selectedTopics.map(topic => `${topic} jobs`) || [];

      // Building search and filter conditions for raw SQL
      let searchCondition = '';
      if (searchTerm?.trim()) {
        const term = `%${searchTerm.toLowerCase()}%`;
        searchCondition = `AND (LOWER(j.job_title) LIKE '${term}' OR LOWER(j.employer_name) LIKE '${term}' OR LOWER(j.job_location) LIKE '${term}')`;
      }

      let remoteCondition = '';
      if (filterRemote === 'remote') {
        remoteCondition = 'AND j.job_is_remote = true';
      } else if (filterRemote === 'onsite') {
        remoteCondition = 'AND j.job_is_remote = false';
      }

      const orderBy = sortBy === 'recent' ? 'j.job_posted_at DESC' : 'total_similarity DESC';

      const jobs = await prisma.$queryRawUnsafe(`
        WITH user_resumes AS (
          SELECT id FROM resume WHERE "userId" = '${userId}'
        ),
        user_full_embeddings AS (
          SELECT embedding FROM resume WHERE id IN (SELECT id FROM user_resumes) AND embedding IS NOT NULL
        ),
        job_overall_similarity AS (
          SELECT 
            j.id AS job_id,
            COALESCE(ROUND(AVG(1 - (j.embedding <=> uf.embedding))::NUMERIC, 3), 0) AS overall_similarity
          FROM jobs j
          LEFT JOIN user_full_embeddings uf ON TRUE
          GROUP BY j.id
        )
        
        SELECT
          j.id,
          j.job_title,
          j.employer_name,
          COALESCE(j.employer_logo, ra."companyLogo") as employer_logo,
          j.job_apply_link,
          j.job_location,
          j.job_is_remote,
          j.job_description,
          j.job_posted_at,
          COALESCE(j."viewCount", 0) as "viewCount",
          o.overall_similarity,
          ROUND((o.overall_similarity + ${OFFSET_VALUE})::NUMERIC, 3) AS total_similarity,
          (rj.id IS NOT NULL) AS is_recruiter_job,
          COUNT(*) OVER() as total_count
        FROM jobs j
        JOIN job_overall_similarity o ON o.job_id = j.id
        LEFT JOIN recruiter_job rj ON rj."jobId" = j.id
        LEFT JOIN recruiter_application ra ON ra."userId" = rj."recruiterId"
        WHERE EXISTS (SELECT 1 FROM user_resumes)
        ${searchCondition}
        ${remoteCondition}
        AND (
          CARDINALITY(ARRAY[${selectedTopics.map(t => `'${t}'`).join(', ')}]::text[]) = 0 
          OR j.category = ANY(ARRAY[${selectedTopics.map(t => `'${t}'`).join(', ')}]::text[])
        )
        ORDER BY ${orderBy}
        LIMIT ${limit}
        OFFSET ${skip}
      `);

      return jobs as any;
    }),

  getJob: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await prisma.jobs.findUnique({
        where: { id: input.id },
        include: {
          recruiterJob: {
            include: {
              recruiter: {
                include: {
                  recruiterApplication: {
                    select: {
                      companyLogo: true,
                    },
                  },
                },
              },
            },
          },
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

  submitApplication: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      fullName: z.string().min(1),
      email: z.string().email(),
      resumeId: z.string().optional(),
      coverLetter: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const job = await prisma.jobs.findUnique({
        where: { id: input.jobId },
        include: { recruiterJob: true },
      });

      if (!job || !job.recruiterJob) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This job does not support internal applications.' });
      }

      const existing = await prisma.candidatePipeline.findFirst({
        where: {
          recruiterJobId: job.recruiterJob.id,
          candidateEmail: input.email,
        }
      });

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already applied to this job.' });
      }

      // Verify resume belongs to user if provided
      if (input.resumeId) {
        const resume = await prisma.resume.findFirst({
          where: { id: input.resumeId, userId: user.id }
        });
        if (!resume) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid resume selected.' });
        }
      }

      const application = await prisma.candidatePipeline.create({
        data: {
          recruiterJobId: job.recruiterJob.id,
          candidateName: input.fullName,
          candidateEmail: input.email,
          resumeId: input.resumeId,
          status: 'NEW',
          notes: input.coverLetter, // storing cover letter in notes for now
        }
      });

      // Increment application count
      await prisma.recruiterJob.update({
        where: { id: job.recruiterJob.id },
        data: { applicationCount: { increment: 1 } }
      });

      return { success: true, applicationId: application.id };
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
