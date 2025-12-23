-- AlterEnum
ALTER TYPE "InterviewStatus" ADD VALUE 'ANALYZED';

-- AlterTable
ALTER TABLE "announcement_read" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "interview" ADD COLUMN     "analysisFeedback" TEXT,
ADD COLUMN     "analysisScore" DOUBLE PRECISION,
ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "perceptionData" JSONB,
ADD COLUMN     "transcript" JSONB;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "jobCertifications" TEXT[];

-- AlterTable
ALTER TABLE "recruiter_application" ADD COLUMN     "verificationDocuments" TEXT;

-- AlterTable
ALTER TABLE "recruiter_job" ADD COLUMN     "jobCertifications" TEXT[];
