import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { endInterview } from "@/lib/interviews";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  console.log('[DEBUG] POST /api/interviews/end entered');
  const DEBUG_LOGGING = process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true';

  try {
    const rawBody = await request.text();
    console.log('[DEBUG] End Interview Body:', rawBody);

    if (!rawBody) {
      throw new Error('Empty request body');
    }

    const { interview_id, transcript, source } = JSON.parse(rawBody);

    if (DEBUG_LOGGING) {
      const interviewIdShort = interview_id ? `${interview_id.substring(0, 8)}...` : 'none';
      console.log(`[DEBUG] End interview request received: ${interviewIdShort} from Source: ${source || 'unknown'}`);
    }

    // Get authenticated session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({
        error: "Unauthorized",
        code: "UNAUTHORIZED"
      }, { status: 401 });
    }

    const userId = session.user.id;

    if (!interview_id) {
      return NextResponse.json({
        error: "Interview ID is required",
        code: "MISSING_INTERVIEW_ID"
      }, { status: 400 });
    }

    // Get interview data
    const interview = await prisma.interview.findFirst({
      where: {
        id: interview_id,
        user_id: userId
      },
      select: {
        id: true,
        status: true,
        conversation_id: true,
        start_time: true,
        user_id: true
      }
    });

    if (!interview) {
      return NextResponse.json({
        error: "Interview not found or access denied",
        code: "NOT_FOUND"
      }, { status: 404 });
    }

    // If interview is already in a terminal state, just return success
    if (['ENDED', 'TIMEOUT', 'CANCELLED'].includes(interview.status)) {
      return NextResponse.json({
        interview_id: interview.id,
        status: interview.status,
        message: `Interview was already ${interview.status.toLowerCase()}`
      });
    }

    // AI session cleanup is handled client-side via the SDK or via session timeout.

    // Now end the interview in database
    if (DEBUG_LOGGING) {
      console.log(`[DEBUG] Calling endInterview for ${interview_id} (User: ${userId})`);
      if (transcript) {
        console.log(`[DEBUG] Transcript received: ${Array.isArray(transcript) ? transcript.length : 'invalid'} items`);
      } else {
        console.log('[DEBUG] No transcript provided in request');
      }
    }

    const result = await endInterview(interview_id, userId, transcript);

    if (DEBUG_LOGGING) {
      console.log('[DEBUG] endInterview completed successfully:', {
        interview_id: result.interview.id,
        status: result.interview.status,
        duration: result.interview.duration_seconds
      });
    }

    return NextResponse.json({
      interview_id: result.interview.id,
      duration_seconds: result.interview.duration_seconds,
      end_time: result.interview.end_time,
      status: result.interview.status,
      remaining_seconds: result.remaining_seconds
    });

  } catch (err: any) {
    console.error('[ERROR] End interview route critical failure:', err);

    return NextResponse.json({
      error: "Failed to end interview",
      code: "INTERNAL_SERVER_ERROR",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
