-- DropIndex
DROP INDEX IF EXISTS "jobs_embedding_idx";

-- DropIndex
DROP INDEX IF EXISTS "resume_embedding_idx";

-- AlterTable to set explicit dimensions (required for indexing)
ALTER TABLE "jobs" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);
ALTER TABLE "resume" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);

-- CreateIndex
CREATE INDEX "jobs_embedding_idx" ON "jobs" USING hnsw ("embedding" vector_cosine_ops);

-- CreateIndex
CREATE INDEX "resume_embedding_idx" ON "resume" USING hnsw ("embedding" vector_cosine_ops);
