'use client'

import { useEffect, useState } from 'react'
import { trpc } from '@/trpc/client'
import { Loader2 } from 'lucide-react'

interface ResumeStatusWrapperProps {
  resumeId: string
  children: React.ReactNode
}

/**
 * Wrapper component that polls resume status and shows a loading overlay when processing.
 * @param resumeId - The ID of the resume to monitor
 * @param children - The content to wrap (editor UI)
 */
export function ResumeStatusWrapper({ resumeId, children }: ResumeStatusWrapperProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Query the resume status with polling
  const { data: resume } = trpc.resume.getUnique.useQuery(
    { resumeId },
    {
      refetchInterval: (data) => {
        if (!data) return false
        const isPending = data.status === 'PENDING' || data.status === 'PROCESSING'
        setIsProcessing(isPending)
        return isPending ? 2000 : false // Poll every 2 seconds if processing
      }
    }
  )

  useEffect(() => {
    if (resume) {
      setIsProcessing(resume.status === 'PENDING' || resume.status === 'PROCESSING')
    }
  }, [resume])

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-2xl border">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">Re-analyzing Resume</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Our AI is analyzing your resume. This usually takes 30-60 seconds. 
                You can stay on this page - it will update automatically when done.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}
