-- CreateTable
CREATE TABLE "resume" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "extractedData" JSONB,
    "analysisData" JSONB,
    "scoreData" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tailored_resume" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT,
    "jobDescription" TEXT,
    "name" TEXT NOT NULL,
    "extractedData" JSONB,
    "analysisData" JSONB,
    "scoreData" JSONB,
    "primaryResumeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "tailored_resume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_userId_idx" ON "resume"("userId");

-- CreateIndex
CREATE INDEX "tailored_resume_primaryResumeId_idx" ON "tailored_resume"("primaryResumeId");

-- CreateIndex
CREATE INDEX "tailored_resume_userId_idx" ON "tailored_resume"("userId");

-- AddForeignKey
ALTER TABLE "resume" ADD CONSTRAINT "resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tailored_resume" ADD CONSTRAINT "tailored_resume_primaryResumeId_fkey" FOREIGN KEY ("primaryResumeId") REFERENCES "resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tailored_resume" ADD CONSTRAINT "tailored_resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
