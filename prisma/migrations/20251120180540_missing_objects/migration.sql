-- Recreate missing objects: extensions, tables and pgvector columns
-- Generated to restore deleted migrations. Verify before applying on production.

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- NOTE: This migration uses vector(1536) for embeddings (text-embedding-3-small).
-- If you use a different embedding size, adjust the vector dimension accordingly.

-- jobs table (basic columns used by ingestion)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  job_publisher TEXT,
  job_title TEXT,
  employer_name TEXT,
  employer_logo TEXT,
  job_apply_link TEXT,
  job_location TEXT,
  job_description TEXT,
  job_posted_at TEXT,
  job_is_remote BOOLEAN,
  qualifications TEXT[],
  responsibilities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- job_skills table
CREATE TABLE IF NOT EXISTS job_skills (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  skill_text TEXT[],
  embedding vector(1536),
  is_required BOOLEAN DEFAULT TRUE,
  UNIQUE(job_id)
);

-- job_responsibilities table
CREATE TABLE IF NOT EXISTS job_responsibilities (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  bullet_text TEXT[],
  embedding vector(1536),
  UNIQUE(job_id)
);

-- resume_skills
CREATE TABLE IF NOT EXISTS resume_skills (
  id TEXT PRIMARY KEY,
  resume_id TEXT REFERENCES resume(id) ON DELETE CASCADE,
  skill_text TEXT NOT NULL,
  embedding vector(1536),
  UNIQUE(resume_id)
);

-- resume_experience
CREATE TABLE IF NOT EXISTS resume_experience (
  id TEXT PRIMARY KEY,
  resume_id TEXT REFERENCES resume(id) ON DELETE CASCADE,
  bullet_text TEXT NOT NULL,
  embedding vector(1536),
  UNIQUE(resume_id)
);

-- Create ivfflat indexes for faster similarity search (if desired)
-- These indexes require storing vectors with the chosen dimension and are optional.
CREATE INDEX IF NOT EXISTS idx_job_skills_vector ON job_skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_job_bullets_vector ON job_responsibilities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_resume_skills_vector ON resume_skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_resume_bullets_vector ON resume_experience USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- job_categories tracker
CREATE TABLE IF NOT EXISTS job_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  location TEXT,
  metadata JSONB,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- job_ingest_runs audit + scheduling
CREATE TABLE IF NOT EXISTS job_ingest_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT REFERENCES job_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

-- Optional: unique index on jobs.job_apply_link if you want deduplication by link
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uniq_jobs_apply_link ON public.jobs (job_apply_link) WHERE job_apply_link IS NOT NULL;

-- Ensure `resume` table exists in your DB (if not managed by Prisma elsewhere, create it accordingly).
-- If other tables/models are missing, create them similarly or re-run the full migration baseline from your schema.
