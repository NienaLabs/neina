'use client'

import { useEffect } from 'react'
import { trpc } from '@/trpc/client'
import { Loader2 } from 'lucide-react'
import { ResumeControlProvider, useResumeControl } from './ResumeControlContext'

import { useRouter } from 'next/navigation'

interface ResumeStatusWrapperProps {
  resumeId: string
  children: React.ReactNode
}

function ResumeStatusLogic({ resumeId, children }: ResumeStatusWrapperProps) {
  const { isProcessing, setIsProcessing } = useResumeControl()
  // Query the resume status with polling
  const { data: resume } = trpc.resume.getUnique.useQuery(
    { resumeId },
    {
      refetchInterval: (data) => {
        if (!data) return false
        const isPending = data.status === 'PENDING' || data.status === 'PROCESSING'
        
        return isPending ? 3000 : false // Poll every 3 seconds
      }
    }
  )

  // Derived state for local UI
  const router = useRouter()

  const isPending = resume?.status === 'PENDING' || resume?.status === 'PROCESSING'

  useEffect(() => {
    // Sync context state
    if (resume) {
      // If we were processing and now we are not, refresh the server/UI
      if (isProcessing && !isPending) {
        router.refresh()
      }
      setIsProcessing(isPending)
    }
  }, [resume, isPending, setIsProcessing, isProcessing, router])

  return (
    <div className="relative min-h-screen">
      {/* Loading Overlay - Matching Resume Card Style */}
      {isPending && (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[2px]">
          <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 animate-pulse text-sm font-semibold text-primary">
              AI Analysis in Progress...
            </p>
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}

/**
 * Wrapper component that provides context and polling logic.
 */
export function ResumeStatusWrapper(props: ResumeStatusWrapperProps) {
  return (
    <ResumeControlProvider>
      <ResumeStatusLogic {...props} />
    </ResumeControlProvider>
  )
}
