-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecruiterJobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'HIRED');

-- AlterTable
ALTER TABLE "announcement" ADD COLUMN     "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "embedding" vector;

-- AlterTable
ALTER TABLE "resume" ADD COLUMN     "embedding" vector;

-- AlterTable
ALTER TABLE "tailored_resume" ADD COLUMN     "jobResponsibilitiesEmbedding" vector,
ADD COLUMN     "jobSkillsEmbedding" vector;

-- CreateTable
CREATE TABLE "recruiter_application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "companyLogo" TEXT,
    "position" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedInProfile" TEXT,
    "message" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_job" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "RecruiterJobStatus" NOT NULL DEFAULT 'ACTIVE',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_pipeline" (
    "id" TEXT NOT NULL,
    "recruiterJobId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_view" (
    "id" TEXT NOT NULL,
    "recruiterJobId" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "job_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_application_userId_key" ON "recruiter_application"("userId");

-- CreateIndex
CREATE INDEX "recruiter_application_status_idx" ON "recruiter_application"("status");

-- CreateIndex
CREATE INDEX "recruiter_application_userId_idx" ON "recruiter_application"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_job_jobId_key" ON "recruiter_job"("jobId");

-- CreateIndex
CREATE INDEX "recruiter_job_recruiterId_idx" ON "recruiter_job"("recruiterId");

-- CreateIndex
CREATE INDEX "recruiter_job_status_idx" ON "recruiter_job"("status");

-- CreateIndex
CREATE INDEX "candidate_pipeline_recruiterJobId_idx" ON "candidate_pipeline"("recruiterJobId");

-- CreateIndex
CREATE INDEX "candidate_pipeline_status_idx" ON "candidate_pipeline"("status");

-- CreateIndex
CREATE INDEX "job_view_recruiterJobId_idx" ON "job_view"("recruiterJobId");

-- CreateIndex
CREATE INDEX "job_view_viewedAt_idx" ON "job_view"("viewedAt");

-- CreateIndex
CREATE INDEX "jobs_embedding_idx" ON "jobs"("embedding");

-- CreateIndex
CREATE INDEX "resume_embedding_idx" ON "resume"("embedding");

-- AddForeignKey
ALTER TABLE "recruiter_application" ADD CONSTRAINT "recruiter_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_job" ADD CONSTRAINT "recruiter_job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_job" ADD CONSTRAINT "recruiter_job_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_recruiterJobId_fkey" FOREIGN KEY ("recruiterJobId") REFERENCES "recruiter_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_view" ADD CONSTRAINT "job_view_recruiterJobId_fkey" FOREIGN KEY ("recruiterJobId") REFERENCES "recruiter_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
