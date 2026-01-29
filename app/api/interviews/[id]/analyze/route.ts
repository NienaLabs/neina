import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateInterviewScore } from "@/lib/ai-scoring";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: interviewId } = await params;
        const userId = session.user.id;

        // 1. Fetch Interview & Validate Ownership
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            select: {
                id: true,
                user_id: true,
                conversation_id: true,
                transcript: true,
                role: true,
                description: true,
                resume_id: true
            }
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        if (interview.user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!interview.conversation_id) {
            return NextResponse.json(
                { error: "No conversation associated with this interview" },
                { status: 400 }
            );
        }

        // 2. Use Stored Transcript from DB
        // We now capture transcript on the client and save it to the DB when the interview ends.
        const transcript = interview.transcript as any[];

        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            console.log('Transcript not available for interview:', interviewId);
            return NextResponse.json(
                {
                    error: "Transcript not found. Please ensure the interview ended correctly and the transcript was saved.",
                },
                { status: 422 }
            );
        }

        console.log(`Using ${transcript.length} messages from stored transcript`);
        console.log("Generating AI Score...");

        let resumeContent = undefined;
        if (interview.resume_id) {
            const resume = await prisma.resume.findUnique({
                where: { id: interview.resume_id }
            });
            if (resume) {
                resumeContent = resume.content;
            }
        }

        const analysis = await generateInterviewScore(
            transcript,
            interview.role || "Job Applicant",
            interview.description || undefined,
            resumeContent
        );

        // Format feedback markdown
        const formattedFeedback = `
${analysis.feedback}

### Key Strengths
${analysis.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${analysis.weaknesses.map(w => `- ${w}`).join('\n')}
        `.trim();

        // 4. Update Database
        const updatedInterview = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                // transcript is already stored, but we update status and score
                perceptionData: {}, // Placeholder for future perception events
                analysisScore: analysis.score,
                analysisFeedback: formattedFeedback,
                analyzedAt: new Date(),
                status: "ANALYZED"
            },
        });

        return NextResponse.json(updatedInterview);

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
