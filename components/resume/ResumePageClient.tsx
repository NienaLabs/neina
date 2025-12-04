'use client'

import { useState, useEffect, useRef } from 'react'
import PrimaryResumeSection from '@/components/resume/PrimaryResumeSection'
import TailoredResumesSection from '@/components/resume/TailoredResumesSection'
import { trpc } from '@/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Resume } from '@/lib/generated/prisma/client'
import { Button } from '../ui/button'
import { SquarePen } from 'lucide-react'
import { toast } from 'sonner'

// Define the types for the resume data
export type PrimaryResumeScoreData = {
  scores: {
    profile: number
    education: number
    experience: number
    projects: number
    skills: number
    certifications: number
    awards: number
    publications: number
    overallScore: number
  }
  customSections: {
    sectionName: string
    score: number
    remarks: string
  }[]
};

export type TailoredResumeScoreData = {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
};

export type TailoredResume = Resume & {
  scores: TailoredResumeScoreData | null;
  role: string;
}

export type ResumeWithTailored = Resume & {
  scores: PrimaryResumeScoreData | null
  tailoredResumes: TailoredResume[]
}

const ResumePageClient = () => {
  const { data: primaryResumes, isLoading, isError, error, refetch } = trpc.resume.getPrimaryResumes.useQuery()
  const [selectedResume, setSelectedResume] = useState<ResumeWithTailored | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils()

  useEffect(() => {
    if (primaryResumes && primaryResumes.length > 0) {
      setSelectedResume(primaryResumes[0] as ResumeWithTailored)
    }
  }, [primaryResumes])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDF file validation
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file!..");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("An error occurred while processing the PDF");
      }

      await utils.resume.getPrimaryResumes.invalidate()
      const res = await response.json();

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }

    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };
     
    if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-red-500">Failed to load resumes: {error.message}</p>
      </div>
    )
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        name="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in-down">
            Resume AI
          </h1>
          <div className="flex flex-row items-center  justify-between mb-4">
          <p className="text-gray-500 text-sm dark:text-gray-400 animate-fade-in-down animation-delay-200">
            Manage and optimize your resumes with the power of AI.
          </p>
         <Button className="animate-fade-in-down animation-delay-40" onClick={() => fileInputRef.current?.click()} disabled={loading}>
          <SquarePen className="mr-2 h-4 w-4" />
          {loading ? "Parsing..." : "Upload New Resume"}
          </Button>        
        </div>

      <div className="space-y-8">
        <div className="animate-fade-in-up">
          <PrimaryResumeSection
            isLoading={isLoading}
            isError={isError}
            error={error}
            resumes={primaryResumes as ResumeWithTailored[]}
            onSelectResume={setSelectedResume}
          />
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

export default ResumePageClient