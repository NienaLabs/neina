/*
  Warnings:

  - You are about to drop the column `polarCheckoutId` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `polarCustomerId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `polarSubscriptionId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `preferredProvider` on the `user` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "interview" ADD COLUMN     "resume_id" TEXT;

-- AlterTable
ALTER TABLE "resume" ADD COLUMN     "status" "ResumeStatus" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "tailored_resume" ADD COLUMN     "status" "ResumeStatus" NOT NULL DEFAULT 'COMPLETED';


-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
