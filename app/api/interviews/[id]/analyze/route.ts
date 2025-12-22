

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTavusConversation } from "@/lib/tavus";
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

        // 2. Fetch Data from Tavus
        console.log(`Fetching Tavus data for conversation: ${interview.conversation_id}`);
        const tavusData = await getTavusConversation(interview.conversation_id);

        // Debug: Log what we got from Tavus
        console.log('Tavus API Response:', JSON.stringify(tavusData, null, 2));

        // Extract transcript from events array
        const transcriptEvent = tavusData?.events?.find(
            (event: any) => event.event_type === 'application.transcription_ready'
        );

        const rawTranscript = transcriptEvent?.properties?.transcript;

        if (!rawTranscript || !Array.isArray(rawTranscript)) {
            console.log('Transcript not available. Tavus data keys:', Object.keys(tavusData || {}));
            return NextResponse.json(
                {
                    error: "Transcript not ready yet. Tavus needs a few minutes to process the conversation after it ends. Please try again in 2-3 minutes.",
                    tavusStatus: tavusData?.status || 'unknown'
                },
                { status: 422 }
            );
        }

        // Map Tavus transcript format to our expected format
        // Tavus: { content: string, role: 'user' | 'assistant' | 'system' }
        // We need: { content: string, role: string } (filtering out system messages)
        const transcript = rawTranscript
            .filter((msg: any) => msg.role !== 'system') // Remove system prompts
            .map((msg: any) => ({
                role: msg.role === 'assistant' ? 'interviewer' : msg.role,
                content: msg.content
            }));

        console.log(`Extracted ${transcript.length} messages from transcript`);

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
        // Extract perception analysis from events
        const perceptionEvent = tavusData?.events?.find(
            (event: any) => event.event_type === 'application.perception_analysis'
        );
        const perceptionData = perceptionEvent?.properties || {};

        const updatedInterview = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                transcript: transcript as any, // Store the cleaned transcript
                perceptionData: perceptionData,
                analysisScore: analysis.score,
                analysisFeedback: formattedFeedback,
                analyzedAt: new Date(),
                status: "ANALYZED" // Update status to ANALYZED
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
