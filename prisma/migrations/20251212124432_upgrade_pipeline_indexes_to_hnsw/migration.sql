-- DropIndex (IVFFlat)
DROP INDEX IF EXISTS "idx_job_bullets_vector";

-- DropIndex (IVFFlat)
DROP INDEX IF EXISTS "idx_job_skills_vector";

-- DropIndex (IVFFlat)
DROP INDEX IF EXISTS "idx_resume_bullets_vector";

-- DropIndex (IVFFlat)
DROP INDEX IF EXISTS "idx_resume_skills_vector";

-- Ensure explicit dimensions (Resume & Jobs are already 1536 from previous migration)
ALTER TABLE "job_responsibilities" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);
ALTER TABLE "job_skills" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);
ALTER TABLE "resume_experience" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);
ALTER TABLE "resume_skills" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);

-- CreateIndex (HNSW)
CREATE INDEX "idx_job_bullets_vector" ON "job_responsibilities" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "idx_job_skills_vector" ON "job_skills" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "idx_resume_bullets_vector" ON "resume_experience" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "idx_resume_skills_vector" ON "resume_skills" USING hnsw ("embedding" vector_cosine_ops);
