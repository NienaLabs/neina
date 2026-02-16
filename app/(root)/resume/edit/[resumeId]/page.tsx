import { trpc } from '@/trpc/server'
import { notFound } from 'next/navigation'
import { ResumeStatusWrapper } from '@/components/resume/ResumeStatusWrapper'
import { PrimaryResumeBuilder } from '@/components/resume/PrimaryResumeBuilder'

interface Props {
    params: Promise<{ resumeId: string }>
}

interface AnalysisData {
    fixes: Record<string, any>;
    [key: string]: unknown;
}

const Page = async ({ params }: Props) => {
    const { resumeId } = await params

    const resume = await trpc.resume.getUnique({ resumeId })

    if (!resume) { return notFound() }

    const { analysisData, extractedData, name } = resume

    // Parse Analysis Data
    const parsedAnalysisData = analysisData ? (typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData) as AnalysisData : { fixes: {} }
    const { fixes = {} } = parsedAnalysisData

    // Parse Extracted Data
    let parsedExtractedData: any = extractedData;
    try {
        parsedExtractedData = typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData;
    } catch (e) {
        console.error("Failed to parse extractedData", e);
        parsedExtractedData = {};
    }

    // Calculate Analysis Stats
    const isTailored = false;
    const score = resume.scoreData as { overallScore?: number; experienceScore?: number; skillsScore?: number } | null;
    
    // Calculate total issues from fixes
    const totalIssues = Object.values(fixes as Record<string, any>).reduce((acc: number, sectionVotes: any) => {
        if (Array.isArray(sectionVotes)) {
            return acc + sectionVotes.length;
        }
        return acc;
    }, 0);

    // Calculate star rating (0-5)
    // If we have an AI score, use that.
    // If not (non-tailored), calculate based on issues: 0 issues = 5 stars, >10 issues = 0 stars approx.
    let starRating = 0;
    if (score?.overallScore) {
        starRating = Math.round(score.overallScore * 5);
    } else {
        const calculatedScore = Math.max(0, 100 - (totalIssues * 5)); // Aggressive deduction for issues
        starRating = Math.round((calculatedScore / 100) * 5);
    }

    return (
        <ResumeStatusWrapper resumeId={resumeId}>
            <PrimaryResumeBuilder 
                initialData={parsedExtractedData} 
                resumeId={resumeId} 
                fixes={fixes}
                resumeName={name || "My Resume"}
                isTailored={isTailored}
                starRating={starRating}
                totalIssues={totalIssues}
                score={score}
            />
        </ResumeStatusWrapper>
    )
}

export default Page
