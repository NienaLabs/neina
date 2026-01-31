import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { forceEndInterview } from "@/lib/interviews";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const DEBUG_LOGGING = process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true';
  try {
    const { interview_id } = await request.json();

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
        message: `Interview was already ${interview.status.toLowerCase()}`,
        already_ended: true
      });
    }

    // Anam session cleanup is typically handled client-side or via timeout.
    // We no longer need the server-side closeDuixSession logic.

    // Now end the interview in database
    const result = await forceEndInterview(interview_id, userId);

    return NextResponse.json({
      interview_id: result.interview.id,
      duration_seconds: result.interview.duration_seconds,
      end_time: result.interview.end_time,
      status: result.interview.status,
      remaining_seconds: result.remaining_seconds,
      message: "Interview ended due to time limit"
    });

  } catch (err: any) {
    if (DEBUG_LOGGING) {
      console.error('[DEBUG] Force end interview error:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    }
    return NextResponse.json({
      error: "Failed to force end interview",
      code: "INTERNAL_SERVER_ERROR",
      details: DEBUG_LOGGING ? err.message : undefined
    }, { status: 500 });
  }
}
