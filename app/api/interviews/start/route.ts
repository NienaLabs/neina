import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startInterview } from "@/lib/interviews";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { role, description, conversation_id } = body;

    if (!role || typeof role !== 'string') {
      console.log('Validation failed: role missing or invalid', { role, type: typeof role });
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Description is optional, but if provided must be a string
    if (description !== undefined && description !== '' && typeof description !== 'string') {
      console.log('Validation failed: description invalid', { description, type: typeof description });
      return NextResponse.json({ error: "Description must be a string if provided" }, { status: 400 });
    }

    if (!conversation_id || typeof conversation_id !== 'string') {
      console.log('Validation failed: conversation_id missing or invalid', { conversation_id, type: typeof conversation_id });
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
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
      select: { remaining_minutes: true }
    });

    console.log('User credits check:', { userId, remaining_minutes: user?.remaining_minutes });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has sufficient time (at least 6 seconds)
    if (user.remaining_minutes < 0.1) {
      console.log('Credit check failed:', {
        remaining_minutes: user.remaining_minutes,
        required: 0.1,
        user_id: userId,
        user_found: !!user
      });
      return NextResponse.json({
        error: `No credits left. Please purchase more minutes to continue.`,
        remaining_seconds: Math.max(0, Math.floor(user.remaining_minutes * 60))
      }, { status: 400 });
    }

    // Idempotency: ensure only one ACTIVE interview per user
    // If an active interview exists, reuse it instead of creating a new one
    const existing = await prisma.interview.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      include: {
        user: {
          select: { remaining_minutes: true }
        }
      }
    });

    console.log('Existing interview check:', { existing: existing?.id, hasExisting: !!existing });

    // Double-check credits for existing interviews too
    if (existing && existing.user.remaining_minutes < 0.1) {
      console.log('Credit check failed for existing interview:', {
        remaining_minutes: existing.user.remaining_minutes,
        required: 0.1,
        user_id: userId,
        interview_id: existing.id
      });
      return NextResponse.json({
        error: `No credits left. Please purchase more minutes to continue.`,
        remaining_seconds: Math.max(0, Math.floor(existing.user.remaining_minutes * 60))
      }, { status: 400 });
    }

    const result = existing
      ? {
        interview: {
          id: existing.id,
          start_time: existing.start_time,
          remaining_seconds: Math.max(0, Math.floor(existing.user.remaining_minutes * 60)),
        },
        has_sufficient_time: true as const,
      }
      : await startInterview({
        user_id: userId,
        role,
        description,
        conversation_id, // Use the conversation_id from frontend
      });

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
      conversation_url: conversation_id ? null : undefined, // Frontend already has the URL
      conversation_id: conversation_id
    });

  } catch (err: any) {
    console.error('Start interview error:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ error: err.message || "Failed to start interview" }, { status: 500 });
  }
}
