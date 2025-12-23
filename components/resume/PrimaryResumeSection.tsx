'use client'

import { useState,useEffect,useRef } from 'react'
import PrimaryResumeCard from './PrimaryResumeCard'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ResumeWithTailored } from './ResumePageClient'
import CreateTailoredResumeDialog from './CreateTailoredResumeDialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { toast } from 'sonner'
import {trpc} from '@/trpc/client'
import { Skeleton } from '../ui/skeleton'
import { FeatureGuide } from '@/components/FeatureGuide'

   
const PrimaryResumeSection = ({
  resumes,
  onSelectResume,
  isLoading,
  isError,
  error
}: {
  resumes: ResumeWithTailored[]
  onSelectResume: (resume: ResumeWithTailored) => void
  isLoading:boolean
  isError:boolean
  error:Error | null
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);
const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils()
  useEffect(() => {
    if (resumes && resumes.length > 0) {
      setSelectedId(resumes[0].id)
    }
  }, [resumes])


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

    }catch (err: unknown) {
  toast.error(
    err instanceof Error
      ? err.message
      : "Something went wrong"
  );
}


      finally {
      setLoading(false);
    }
  };
  
   

  const handleSelect = (resume: ResumeWithTailored) => {
    setSelectedId(resume.id)
    onSelectResume(resume)
  }

  const handleCreateTailored = (resumeId: string) => {
    setSelectedResumeId(resumeId)
    setIsDialogOpen(true)
  }
 
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
        <p className="text-red-500">Failed to load resumes: {error?.message}</p>
      </div>
    )
  }



  return (
    <div>
  
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
  
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Primary Resumes
        </h2>
        <FeatureGuide 
          title="Primary Resumes"
          description="Manage your base resumes here. Upload new PDFs to get started."
        />
      </div>
    
      {resumes && resumes.length > 0 ? (
        <>
          <Carousel className="w-full max-w-6xl mx-auto relative">
            <CarouselContent>
              {resumes.map((resume) => (
                <CarouselItem
                  key={resume.id}
                  className="basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-2">
                    <PrimaryResumeCard
                      resume={resume}
                      isSelected={selectedId === resume.id}
                      onSelect={() => handleSelect(resume)}
                      onCreateTailored={handleCreateTailored}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Ensure arrows are visible and positioned nicely */}
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background shadow-md border rounded-full w-10 h-10 flex items-center justify-center" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background shadow-md border rounded-full w-10 h-10 flex items-center justify-center" />
          </Carousel>

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
          
        <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
         <Upload className="mr-2 h-4 w-4" />
        {loading ? "Parsing..." : "Upload PDF"}
        </Button>

        </Empty>
      )}     
      
    </div>
  )
}

export default PrimaryResumeSection
