import JobSearchClient from '../../../components/job-search/JobSearchClient'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Job Search',
  description: 'Find your next career opportunity with AI-powered matching.',
}

export default function JobSearchPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <JobSearchClient />
    </div>
  )
}