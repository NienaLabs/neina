import { createTRPCRouter, protectedProcedure } from '../init'
import prisma from '@/lib/prisma'

export const jobsRouter = createTRPCRouter({
  getReccommendedJobs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const OFFSET_VALUE = 0.1 // Adjust this value to compensate for unnecessary embedding data

   return await prisma.$queryRaw`
  WITH user_resumes AS (
    SELECT id FROM resume WHERE "userId" = ${userId}
  ),
  user_skill_embeddings AS (
    SELECT embedding FROM resume_skills WHERE resume_id IN (SELECT id FROM user_resumes) AND embedding IS NOT NULL
  ),
  user_resp_embeddings AS (
    SELECT embedding FROM resume_experience WHERE resume_id IN (SELECT id FROM user_resumes) AND embedding IS NOT NULL
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
    s.skill_similarity,
    r.responsibility_similarity,
    CASE 
      WHEN s.skill_similarity = 0 THEN ROUND((r.responsibility_similarity + ${OFFSET_VALUE})::NUMERIC, 3)
      ELSE ROUND((s.skill_similarity * 0.7 + r.responsibility_similarity * 0.3 + ${OFFSET_VALUE})::NUMERIC, 3)
    END AS total_similarity
  FROM jobs j
  JOIN job_skill_similarity s ON s.job_id = j.id
  JOIN job_resp_similarity r ON r.job_id = j.id
  WHERE EXISTS (SELECT 1 FROM user_resumes)
  ORDER BY total_similarity DESC
`

  }),
})

export default jobsRouter
