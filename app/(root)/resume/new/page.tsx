'use client'
import dynamic from 'next/dynamic'

const TiptapEditor = dynamic(() => import('@/components/tiptap/editor'), { ssr: false })

export default function Page() {
  return (
    <div className="p-10">
      <TiptapEditor />
    </div>
  )
}