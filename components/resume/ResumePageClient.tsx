'use client'

import { useState, useEffect } from 'react'
import PrimaryResumeSection from '@/components/resume/PrimaryResumeSection'
import TailoredResumesSection from '@/components/resume/TailoredResumesSection'
import { trpc } from '@/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Resume } from '@/lib/generated/prisma/client'
import CreateResumeDialog from './CreateResumeDialog'

// Define the types for the resume data
export type ScoreData = {
  scores: {
    overallScore: number
  }
}

export type TailoredResume = Resume & {
  scoreData: ScoreData | null
}

export type ResumeWithTailored = Resume & {
  scoreData: ScoreData | null
  tailoredResumes: TailoredResume[]
}

const ResumePageClient = () => {
  const { data: primaryResumes, isLoading, isError, error } = trpc.resume.getPrimaryResumes.useQuery()

  const [selectedResume, setSelectedResume] = useState<ResumeWithTailored | null>(null)

  useEffect(() => {
    if (primaryResumes && primaryResumes.length > 0) {
      setSelectedResume(primaryResumes[0] as ResumeWithTailored)
    }
  }, [primaryResumes])

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-red-500">Failed to load resumes: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in-down">
            Resume AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 animate-fade-in-down animation-delay-200">
            Manage and optimize your resumes with the power of AI.
          </p>
        </div>
        <CreateResumeDialog />
      </div>

      <div className="space-y-8">
        <div className="animate-fade-in-up">
          <PrimaryResumeSection
            resumes={primaryResumes as ResumeWithTailored[]}
            onSelectResume={setSelectedResume}
          />
        </div>
        <div className="animate-fade-in-up animation-delay-200">
          <TailoredResumesSection
            tailoredResumes={selectedResume?.tailoredResumes}
          />
        </div>
      </div>
    </div>
  )
}

export default ResumePageClient