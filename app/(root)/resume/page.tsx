import { trpc, HydrateClient } from '@/trpc/server'
import ResumePageClient from '../../../components/resume/ResumePageClient'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Resumes',
  description: 'Manage, edit, and tailor your AI-powered resumes.',
}

import { Activity } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const ResumePage = async () => {
  await trpc.resume.getPrimaryResumes.prefetch()

  return (
    <HydrateClient>
      <Activity mode="visible" fallback={
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }>
        <ResumePageClient />
      </Activity>
    </HydrateClient>
  )
}

export default ResumePage
