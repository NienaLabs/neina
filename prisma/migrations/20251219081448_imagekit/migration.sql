
-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "jobCertifications" TEXT[];

-- AlterTable
ALTER TABLE "recruiter_application" ADD COLUMN     "verificationDocuments" TEXT;

-- AlterTable
ALTER TABLE "recruiter_job" ADD COLUMN     "jobCertifications" TEXT[];
