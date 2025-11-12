'use client'

import { useState } from 'react'
import PrimaryResumeSection from '@/components/resume/PrimaryResumeSection'
import TailoredResumesSection from '@/components/resume/TailoredResumesSection'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { primaryResumes } from '@/constants/constant'

const ResumePage = () => {
  const [selectedResume, setSelectedResume] = useState(
    primaryResumes.length > 0 ? primaryResumes[0] : null
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in-down">
            Resume AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 animate-fade-in-down animation-delay-200">
            Manage and optimize your resumes with the power of AI.
          </p>
        </div>
        <Button className="animate-fade-in-down animation-delay-400">
          <Upload className="mr-2 h-4 w-4" />
          Create New Resume
        </Button>
      </div>

      <div className="space-y-8">
        <div className="animate-fade-in-up">
          <PrimaryResumeSection onSelectResume={setSelectedResume} />
        </div>
        <div className="animate-fade-in-up animation-delay-200">
          <TailoredResumesSection
            tailoredResumes={selectedResume?.tailoredResumes}
          />
        </div>
      </div>
    </div>
  )
}

export default ResumePage
