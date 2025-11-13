import { useState, useEffect } from 'react'
import PrimaryResumeCard from './PrimaryResumeCard'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ResumeWithTailored } from './ResumePageClient'
import CreateTailoredResumeDialog from './CreateTailoredResumeDialog'

const PrimaryResumeSection = ({
  resumes,
  onSelectResume,
}: {
  resumes: ResumeWithTailored[]
  onSelectResume: (resume: ResumeWithTailored) => void
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  useEffect(() => {
    if (resumes && resumes.length > 0) {
      setSelectedId(resumes[0].id)
    }
  }, [resumes])

  const handleSelect = (resume: ResumeWithTailored) => {
    setSelectedId(resume.id)
    onSelectResume(resume)
  }

  const handleCreateTailored = (resumeId: string) => {
    setSelectedResumeId(resumeId)
    setIsDialogOpen(true)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Primary Resumes
      </h2>
      {resumes && resumes.length > 0 ? (
        <>
          <div className="flex flex-wrap flex-row gap-2 min-w-full p-2 -m-1">
            {resumes.map((resume) => (
              <div key={resume.id} className="p-1 w-full md:w-1/2 lg:w-1/3">
                <PrimaryResumeCard
                  resume={resume}
                  isSelected={selectedId === resume.id}
                  onSelect={() => handleSelect(resume)}
                  onCreateTailored={handleCreateTailored}
                />
              </div>
            ))}
          </div>
          {selectedResumeId && (
            <CreateTailoredResumeDialog
              primaryResumeId={selectedResumeId}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            />
          )}
        </>
      ) : (
        <Empty
          icon={<Upload className="h-12 w-12 text-gray-400" />}
          title="No Primary Resumes"
          description="Upload your first resume to get started."
        >
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Resume
          </Button>
        </Empty>
      )}
    </div>
  )
}

export default PrimaryResumeSection