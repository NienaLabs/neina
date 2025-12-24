import type { Metadata } from 'next'
import VideoInterviewClient from './VideoInterviewClient'

export const metadata: Metadata = {
  title: 'AI Interview Practice',
  description: 'Practice real-time job interviews with our AI coach.',
}

export default function Page() {
  return <VideoInterviewClient />
}