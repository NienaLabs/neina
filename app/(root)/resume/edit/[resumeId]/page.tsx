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

    // Calculate total issues from fixes
    const totalIssues = Object.values(fixes as Record<string, any>).reduce((acc: number, sectionVotes: any) => {
        if (Array.isArray(sectionVotes)) {
            return acc + sectionVotes.length;
        }
        return acc;
    }, 0);

    const isTailored = false;
    const scoreData = (resume as any).scoreData as { scores?: { overallScore?: number }; overallScore?: number } | null;
    const rawOverall = scoreData?.scores?.overallScore ?? scoreData?.overallScore ?? 0;

    // Calculate star rating (0-5)
    // score is out of 10, convert to 0-5 stars
    let starRating = 0;
    if (rawOverall > 0) {
        starRating = Math.round((rawOverall / 10) * 5);
    } else {
        const calculatedScore = Math.max(0, 100 - (totalIssues * 5));
        starRating = Math.round((calculatedScore / 100) * 5);
    }

    // Keep score shape compatible with PrimaryResumeBuilder prop
    const score = scoreData;

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
