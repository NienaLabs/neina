/*
  Warnings:

  - You are about to drop the column `remaining_minutes` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_id` on the `user` table. All the data in the column will be lost.
  - The `plan` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SUBSCRIPTION', 'CREDIT_PURCHASE', 'MINUTE_PURCHASE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_subscription_id_fkey";

-- DropIndex
DROP INDEX "idx_job_bullets_vector";

-- DropIndex
DROP INDEX "idx_job_skills_vector";

-- DropIndex
DROP INDEX "jobs_embedding_idx";

-- DropIndex
DROP INDEX "resume_embedding_idx";

-- DropIndex
DROP INDEX "idx_resume_bullets_vector";

-- DropIndex
DROP INDEX "idx_resume_skills_vector";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "remaining_minutes",
DROP COLUMN "subscription_id",
ADD COLUMN     "interview_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
DROP COLUMN "plan",
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ALTER COLUMN "resume_credits" SET DEFAULT 3;

-- DropTable
DROP TABLE "subscription";

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "TransactionType" NOT NULL,
    "plan" "Plan",
    "credits" INTEGER,
    "minutes" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limiter_flexible" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "rate_limiter_flexible_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_reference_key" ON "transaction"("reference");

-- CreateIndex
CREATE INDEX "transaction_userId_idx" ON "transaction"("userId");

-- CreateIndex
CREATE INDEX "transaction_reference_idx" ON "transaction"("reference");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
