'use client'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/trpc/client'
import { TailoredResume } from './ResumePageClient'
import { toast } from 'sonner'
import TailoredResumeCard from './TailoredResumeCard'
import { Sparkles, Search } from 'lucide-react'

const TailoredResumesSection = ({
  tailoredResumes,
}: {
  tailoredResumes: TailoredResume[] | undefined
}) => {
  
  const utils = trpc.useUtils()

  const setPrimaryMutation = trpc.resume.setPrimary.useMutation({
    onSuccess: () => {
      utils.resume.getPrimaryResumes.invalidate()
      utils.resume.getTailoredResumes.invalidate()
      toast.success("Primary resume set successfully")
    },
  })

  const deleteResumeMutation = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.getPrimaryResumes.invalidate()
      utils.resume.getTailoredResumes.invalidate()
      toast.success("Resume deleted successfully")
    },
  })

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold tracking-tight">Tailored Resumes</h2>
       </div>
       
      {!tailoredResumes || tailoredResumes.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="p-4 rounded-full bg-muted text-muted-foreground">
                    <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold">No Tailored Resumes Yet</h3>
                <p className="text-muted-foreground max-w-md">
                    Create a tailored resume from your primary resume to target specific job applications.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tailoredResumes.map((resume) => (
                <div key={resume.id} className="h-full">
                    <TailoredResumeCard 
                        resume={resume} 
                        onSetPrimary={(id) => setPrimaryMutation.mutate({ resumeId: id })}
                        onDelete={(id) => deleteResumeMutation.mutate({ resumeId: id })}
                    />
                </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default TailoredResumesSection
