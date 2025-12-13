import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startInterview } from "@/lib/interviews";
import { auth } from "@/lib/auth";
import { createTavusConversation } from "@/lib/tavus";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { role, description } = body;


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
      console.log('Credit check failed for existing interview:', {
        interview_minutes: existing.user.interview_minutes,
        required: 0.1,
        user_id: userId,
        interview_id: existing.id
      });
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
        },
        has_sufficient_time: true as const,
      }
      : await (async () => {
        // Create Tavus conversation ONLY after credit checks pass
        console.log('Creating Tavus conversation for user:', userId);
        const tavusResult = await createTavusConversation(role, description || `Interview for ${role}`);

        if (!tavusResult?.url || !tavusResult?.conversation_id) {
          throw new Error('Failed to create Tavus conversation');
        }

        return startInterview({
          user_id: userId,
          role,
          description,
          conversation_id: tavusResult.conversation_id,
          conversation_url: tavusResult.url
        });
      })();


    console.log('Interview creation result:', {
      success: !!result,
      interview_id: result?.interview?.id,
      has_sufficient_time: result?.has_sufficient_time,
      warning: result?.warning
    });

    if (!result.has_sufficient_time) {
      return NextResponse.json({
        error: result.warning,
        remaining_seconds: result.interview.remaining_seconds
      }, { status: 400 });
    }

    return NextResponse.json({
      interview_id: result.interview.id,
      start_time: result.interview.start_time,
      remaining_seconds: result.interview.remaining_seconds,
      conversation_url: result.interview.conversation_url,
      conversation_id: result.interview.conversation_id

    });

  } catch (err: any) {
    console.error('Start interview error:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ error: err.message || "Failed to start interview" }, { status: 500 });
  }
}
