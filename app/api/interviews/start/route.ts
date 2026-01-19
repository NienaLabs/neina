import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startInterview } from "@/lib/interviews";
import { auth } from "@/lib/auth";
import { generateDuixSign } from "@/lib/duix";


export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (!rawBody) {
      throw new Error('Empty request body');
    }

    const body = JSON.parse(rawBody);
    const { role, description, useResume } = body;

    const DUIX_API_ID = process.env.DUIX_API_ID;
    const DUIX_API_KEY = process.env.DUIX_API_KEY;
    const DUIX_AVATAR_ID = process.env.DUIX_AVATAR_ID;

    if (!DUIX_API_ID || !DUIX_API_KEY || !DUIX_AVATAR_ID) {
      throw new Error("Duix configuration is missing (API_ID, API_KEY, or AVATAR_ID)");
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

    // conversation_id is no longer required from client as we create it here


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

    // Idempotency: ensure only one ACTIVE interview per user
    // If an active interview exists, reuse it instead of creating a new one
    const existing = await prisma.interview.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      include: {
        user: {
          select: { interview_minutes: true }
        }
      }
    });

    console.log('Existing interview check:', { existing: existing?.id, hasExisting: !!existing });

    // Double-check credits for existing interviews too
    if (existing && existing.user.interview_minutes < 0.1) {
      return NextResponse.json({
        error: `No credits left. Please purchase more minutes to continue.`,
        remaining_seconds: Math.max(0, Math.floor(existing.user.interview_minutes * 60))
      }, { status: 400 });
    }

    const result = existing
      ? {
        interview: {
          id: existing.id,
          start_time: existing.start_time,
          remaining_seconds: Math.max(0, Math.floor(existing.user.interview_minutes * 60)),
          conversation_id: existing.conversation_id,
        },
        has_sufficient_time: true as const,
        warning: undefined as string | undefined,
      }
      : await (async () => {
        // Create Duix session metadata ONLY after credit checks pass
        console.log('Preparing Duix session for user:', userId);

        let resumeId = undefined;

        if (useResume) {
          const primaryResume = await prisma.resume.findFirst({
            where: { userId, isPrimary: true }
          });
          if (primaryResume) {
            resumeId = primaryResume.id;
          }
        }

        // We use the Avatar ID as the conversation ID for Duix initialization
        const conversation_id = DUIX_AVATAR_ID;

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

    // Generate the signature for Duix SDK
    const sign = generateDuixSign(DUIX_API_ID, DUIX_API_KEY, userId);

    // Fetch resume content if requested
    let resumeContent = undefined;
    if (useResume) {
      const primaryResume = await prisma.resume.findFirst({
        where: { userId, isPrimary: true },
        select: { content: true }
      });
      resumeContent = primaryResume?.content;
    }

    return NextResponse.json({
      interview_id: result.interview.id,
      start_time: result.interview.start_time,
      remaining_seconds: result.interview.remaining_seconds,
      conversation_id: result.interview.conversation_id,
      duix_sign: sign,
      duix_app_id: DUIX_API_ID,
      duix_platform: "duix.com",
      resume_content: resumeContent
    });

  } catch (err: any) {
    console.error('Start interview error:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ error: err.message || "Failed to start interview" }, { status: 500 });
  }
}
