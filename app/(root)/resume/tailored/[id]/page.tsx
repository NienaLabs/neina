import { notFound } from "next/navigation";
import { trpc } from "@/trpc/server";
import { ResumeBuilder } from "@/components/resume/tailored/ResumeBuilder";
import { mapExtractionToResumeData } from "@/lib/resume-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TailoredResumeEditPage({ params }: PageProps) {
  const { id } = await params;
  
  const resume = await trpc.resume.getUnique({ resumeId: id });

  if (!resume) {
    return notFound();
  }

  // Parse data Safely
  let extractedData;
  try {
      extractedData = typeof resume.extractedData === 'string' 
        ? JSON.parse(resume.extractedData) 
        : resume.extractedData;
  } catch (e) {
      console.error("Failed to parse extractedData", e);
      extractedData = null;
  }

  // Analysis Data
  let analysisDataRaw;
  try {
    analysisDataRaw = typeof resume.analysisData === 'string'
        ? JSON.parse(resume.analysisData)
        : resume.analysisData;
  } catch (e) {
      console.error("Failed to parse analysisData", e);
      analysisDataRaw = null;
  }
    
  const matchedKeywords = (analysisDataRaw?.matches || []) as string[];
  const missingKeywords = (analysisDataRaw?.missing || []) as string[];

  // Normalize to ResumeData type using the shared mapper
  const resumeData = mapExtractionToResumeData(extractedData, resume.name);

  // Scores
  const scores = typeof resume.scores === 'string'
      ? JSON.parse(resume.scores)
      : resume.scores;

  // @ts-ignore
  const score = (scores?.wordMatchScore !== undefined ? scores.wordMatchScore : scores?.finalScore) || 0;
  
  // Job Description
  const jobDescription = (resume as any).jobDescription || "";

  return (
    <ResumeBuilder 
        resumeId={id}
        initialData={resumeData}
        jobDescription={jobDescription}
        matchedKeywords={matchedKeywords}
        missingKeywords={missingKeywords}
        wordMatchScore={score}
        status={resume.status}
        coverLetter={(resume as any).coverLetter}
    />
  );
}
