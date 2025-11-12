'use client'

import { useState } from 'react'
import { primaryResumes } from '@/constants/constant'
import PrimaryResumeCard from './PrimaryResumeCard'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { Resume } from '@/lib/generated/prisma/client'

const PrimaryResumeSection = ({ onSelectResume }:{onSelectResume:(resume:any)=>void}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    primaryResumes.length > 0 ? primaryResumes[0].id : null
  )

  const handleSelect = (resume:Resume) => {
    setSelectedId(resume.id)
    onSelectResume(resume)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Primary Resumes
      </h2>
      {primaryResumes.length > 0 ? (
        <div className="flex p-5 gap-4 overflow-x-auto pb-4">
          {primaryResumes.map((resume:any) => (
            <PrimaryResumeCard
              key={resume.id}
              resume={resume}
              isSelected={selectedId === resume.id}
              onSelect={() => handleSelect(resume)}
            />
          ))}
        </div>
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
