import { trpc, HydrateClient } from '@/trpc/server'
import ResumePageClient from '../../../components/resume/ResumePageClient'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Resumes',
  description: 'Manage, edit, and tailor your AI-powered resumes.',
}

const ResumePage = async () => {
  await trpc.resume.getPrimaryResumes.prefetch()

  return (
    <HydrateClient>
      <ResumePageClient />
    </HydrateClient>
  )
}

export default ResumePage
