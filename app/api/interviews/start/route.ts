import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startInterview } from "@/lib/interviews";
import { auth } from "@/lib/auth";
import { generateAnamSessionToken } from "@/lib/anam";
import { interviewerSystemPrompt } from "@/constants/prompts";


export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (!rawBody) {
      throw new Error('Empty request body');
    }

    const body = JSON.parse(rawBody);
    const { role, description, useResume, interviewId } = body;

    const ANAM_AVATAR_ID = process.env.ANAM_AVATAR_ID || process.env.ANAM_PERSONA_ID;
    const ANAM_VOICE_ID = process.env.ANAM_VOICE_ID;
    const ANAM_LLM_ID = process.env.ANAM_LLM_ID;

    if (!ANAM_AVATAR_ID || !ANAM_VOICE_ID || !ANAM_LLM_ID) {
      console.error('[ANAM] Missing configuration component:', {
        avatar: !!ANAM_AVATAR_ID,
        voice: !!ANAM_VOICE_ID,
        llm: !!ANAM_LLM_ID
      });
      throw new Error(`Anam configuration is missing. Required: AVATAR_ID, VOICE_ID, LLM_ID. (Found: AVATAR=${!!ANAM_AVATAR_ID}, VOICE=${!!ANAM_VOICE_ID}, LLM=${!!ANAM_LLM_ID})`);
    }

    if (!role || typeof role !== 'string') {
      console.log('Validation failed: role missing or invalid', { role, type: typeof role });
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Description is optional, but if provided must be a string
    if (description !== undefined && description !== '' && typeof description !== 'string') {
      console.log('Validation failed: description invalid', { description, type: typeof description });
      return NextResponse.json({ error: "Description must be a string if provided" }, { status: 400 });
    }

    // Get authenticated session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Starting interview for user:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interview_minutes: true }
    });

    console.log('User credits check:', { userId, interview_minutes: user?.interview_minutes });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has sufficient time (at least 6 seconds)
    if (user.interview_minutes < 0.1) {
      console.log('Credit check failed:', {
        interview_minutes: user.interview_minutes,
        required: 0.1,
        user_id: userId,
        user_found: !!user
      });
      return NextResponse.json({
        error: `No credits left. Please purchase more minutes to continue.`,
        remaining_seconds: Math.max(0, Math.floor(user.interview_minutes * 60))
      }, { status: 400 });
    }

    // Capture existing interview if interviewId is provided
    let existingInterview = null;
    if (interviewId) {
      existingInterview = await prisma.interview.findFirst({
        where: { id: interviewId, user_id: userId },
      });
    }

    // Idempotency: ensure only one ACTIVE or SCHEDULED interview per user
    // If an active/scheduled interview exists, reuse it instead of creating a new one
    const activeSession = existingInterview || await prisma.interview.findFirst({
      where: { user_id: userId, status: { in: ['ACTIVE', 'SCHEDULED'] } },
    });

    console.log('Interview check:', { id: activeSession?.id, hasExisting: !!activeSession });

    const result = activeSession
      ? {
        interview: {
          id: activeSession.id,
          start_time: activeSession.start_time,
          remaining_seconds: Math.max(0, Math.floor(user.interview_minutes * 60)),
          conversation_id: activeSession.conversation_id,
        },
        has_sufficient_time: true as const,
        warning: undefined as string | undefined,
      }
      : await (async () => {
        // Create Anam session metadata ONLY after credit checks pass
        console.log('Preparing Anam session for user:', userId);

        let resumeId = undefined;

        if (useResume) {
          const primaryResume = await prisma.resume.findFirst({
            where: { userId, isPrimary: true }
          });
          if (primaryResume) {
            resumeId = primaryResume.id;
          }
        }

        // Use Avatar ID as default conversation ID for tracking if none exists
        const conversation_id = ANAM_AVATAR_ID;

        return startInterview({
          user_id: userId,
          role,
          description,
          conversation_id: conversation_id,
          resume_id: resumeId
        });
      })();

    if (!result.has_sufficient_time) {
      return NextResponse.json({
        error: result.warning,
        remaining_seconds: result.interview.remaining_seconds
      }, { status: 400 });
    }

    // Fetch resume content if requested
    let resumeContent = undefined;
    if (useResume) {
      const primaryResume = await prisma.resume.findFirst({
        where: { userId, isPrimary: true },
        select: { content: true }
      });
      resumeContent = primaryResume?.content;
    }

    // Get questions from interview record if they exist
    let preGeneratedQuestions: string[] | undefined = undefined;
    const interviewRecord = await prisma.interview.findUnique({
      where: { id: result.interview.id! },
      select: { questions: true }
    });

    if (interviewRecord?.questions && Array.isArray(interviewRecord.questions)) {
      preGeneratedQuestions = interviewRecord.questions as string[];
    }

    // Generate the dynamic interviewer prompt
    console.log('[ANAM] Generating system prompt. Questions included:', !!preGeneratedQuestions);
    const systemPrompt = interviewerSystemPrompt(role, description, resumeContent, preGeneratedQuestions);

    // Generate the ephemeral session token for Anam AI SDK v4
    const sessionToken = await generateAnamSessionToken({
      personaId: process.env.ANAM_PERSONA_ID,
      avatarId: process.env.ANAM_AVATAR_ID,
      voiceId: process.env.ANAM_VOICE_ID,
      llmId: process.env.ANAM_LLM_ID,
      toolIds: process.env.TOOL_CALL_ID ? [process.env.TOOL_CALL_ID] : [],
      systemPrompt
    });

    return NextResponse.json({
      interview_id: result.interview.id,
      start_time: result.interview.start_time,
      remaining_seconds: result.interview.remaining_seconds,
      conversation_id: result.interview.conversation_id,
      anam_session_token: sessionToken,
      resume_content: resumeContent
    });


  } catch (err: any) {
    console.error('Start interview error:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ error: err.message || "Failed to start interview" }, { status: 500 });
  }
}
