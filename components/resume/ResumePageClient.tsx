'use client'

import { useState, useEffect, useRef } from 'react'
import PrimaryResumeSection from '@/components/resume/PrimaryResumeSection'
import TailoredResumesSection from '@/components/resume/TailoredResumesSection'
import { trpc } from '@/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Resume } from '@/lib/generated/prisma/client'
import { Button } from '../ui/button'
import { SquarePen, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { FeatureGuide } from '@/components/FeatureGuide'
import { ResumePageSkeleton } from './ResumePageSkeleton'

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
  overallScore?: number;
  skillsScore?: number;
  experienceScore?: number;
  finalScore: number; 
  wordMatchScore?: number;
  totalKeywords?: number;
  matchedCount?: number;
};

export type TailoredResume = Resume & {
  scores: TailoredResumeScoreData | null;
  role: string;
  scoreData: TailoredResumeScoreData | null;
}

export type ResumeWithTailored = Resume & {
  scores: PrimaryResumeScoreData | null
  tailoredResumes: TailoredResume[]
  scoreData: PrimaryResumeScoreData | null // Include scoreData in type definition
}

const ResumePageClient = () => {
  const { data: primaryResumes, isLoading, isError, error, refetch } = trpc.resume.getPrimaryResumes.useQuery(undefined, {
  })
  const [selectedResume, setSelectedResume] = useState<ResumeWithTailored | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils()

  useEffect(() => {
    if (primaryResumes) {
      // Check if any resume or tailored resume is pending/processing
      const hasPending = primaryResumes.some(resume => 
        resume?.status === 'PENDING' || 
        resume?.status === 'PROCESSING' ||
        (Array.isArray(resume?.tailoredResumes) && resume.tailoredResumes.some(tr => tr?.status === 'PENDING' || tr?.status === 'PROCESSING'))
      );

      if (hasPending) {
        const interval = setInterval(() => {
          utils.resume.getPrimaryResumes.invalidate();
        }, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [primaryResumes, utils]);

  useEffect(() => {
    if (primaryResumes && primaryResumes.length > 0) {
      // If selectedResume is not set, set it to the first one
      // If it is set, find the updated version of it in the new data
      setSelectedResume(prev => {
          if (!prev) return primaryResumes[0] as ResumeWithTailored;
          const updated = primaryResumes.find(r => r.id === prev.id);
          return (updated || primaryResumes[0]) as ResumeWithTailored;
      })
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
    return <ResumePageSkeleton />
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-red-500">Failed to load resumes: {error.message}</p>
      </div>
    )
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <input
        ref={fileInputRef}
        type="file"
        name="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Resume AI
                </h1>
                <FeatureGuide 
                    title="Resume AI"
                    description="Your central hub for managing resumes. Upload a base resume, then create tailored versions optimized for specific job applications."
                    className="ml-2"
                />
            </div>
            <p className="text-muted-foreground max-w-lg">
                Manage your primary resumes and create tailored versions to perfectly match your dream jobs.
            </p>
        </div>
        <Button 
            size="lg"
            className="shadow-lg hover:shadow-primary/25 transition-all"
            onClick={() => fileInputRef.current?.click()} 
            disabled={loading}
        >
          <SquarePen className="mr-2 h-4 w-4" />
          {loading ? "Parsing..." : "Upload New Resume"}
        </Button>        
      </div>

      <div className="space-y-12">
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <PrimaryResumeSection
            isLoading={isLoading}
            isError={isError}
            error={error}
            resumes={primaryResumes as ResumeWithTailored[]}
            onSelectResume={setSelectedResume}
          />
        </div>
        
        {selectedResume && (
             <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <TailoredResumesSection
                    tailoredResumes={selectedResume?.tailoredResumes}
                />
            </div>
        )}
      </div>
    </div>
  )
}

export default ResumePageClient