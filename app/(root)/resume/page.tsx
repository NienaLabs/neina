import { trpc, HydrateClient } from '@/trpc/server'
import ResumePageClient from '../../../components/resume/ResumePageClient'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Resumes',
  description: 'Manage, edit, and tailor your AI-powered resumes.',
}

import { Activity } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumePageSkeleton } from '@/components/resume/ResumePageSkeleton'

const ResumePage = async () => {
  await trpc.resume.getPrimaryResumes.prefetch()

  return (
    <HydrateClient>
      <Activity mode="visible">
        <ResumePageClient />
      </Activity>
    </HydrateClient>
  )
}

export default ResumePage
