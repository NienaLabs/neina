import { trpc, HydrateClient } from '@/trpc/server'
import ResumePageClient from '../../../components/resume/ResumePageClient'

const ResumePage = async () => {
  await trpc.resume.getPrimaryResumes.prefetch()

  return (
    <HydrateClient>
      <ResumePageClient />
    </HydrateClient>
  )
}

export default ResumePage
