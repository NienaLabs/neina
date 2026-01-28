'use client'

import dynamic from 'next/dynamic'

const VideoInterviewClient = dynamic(() => import('./VideoInterviewClient'), {
  ssr: false,
})

export default function Page() {
  return <VideoInterviewClient />
}