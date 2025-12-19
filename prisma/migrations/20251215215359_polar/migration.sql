-- CreateEnum
CREATE TYPE "TransactionProvider" AS ENUM ('PAYSTACK', 'POLAR');

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
ALTER TABLE "transaction" ADD COLUMN     "polarCheckoutId" TEXT,
ADD COLUMN     "provider" "TransactionProvider" NOT NULL DEFAULT 'PAYSTACK';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "polarCustomerId" TEXT,
ADD COLUMN     "polarSubscriptionId" TEXT,
ADD COLUMN     "preferredProvider" TEXT DEFAULT 'AUTO';
