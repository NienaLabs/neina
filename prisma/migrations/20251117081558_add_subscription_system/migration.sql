-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'TIMEOUT');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "remaining_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "subscription_id" TEXT;

CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "total_minutes" INTEGER NOT NULL CHECK ("total_minutes" > 0),
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "role" TEXT,
    "description" TEXT,

    CONSTRAINT "interview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
