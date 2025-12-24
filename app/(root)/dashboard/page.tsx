import type { Metadata } from 'next'
import DashboardPageClient from './DashboardPageClient'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your job search, resumes, and interview practice.',
}

export default function Page() {
  return <DashboardPageClient />
}
