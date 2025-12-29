import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getRemainingTime } from "@/lib/interviews";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/interviews/time
 * 
 * Retrieves the remaining time for an active interview.
 * Requires authentication and verifies interview ownership.
 * 
 * @param request - Request object with interview_id query parameter
 * @returns Remaining time data including seconds remaining and warning levels
 */
export async function GET(request: Request) {
  try {
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
    const { searchParams } = new URL(request.url);
    const interview_id = searchParams.get('interview_id');

    if (!interview_id) {
      return NextResponse.json({
        error: "Missing interview_id",
        code: "MISSING_INTERVIEW_ID"
      }, { status: 400 });
    }

    // Verify interview exists and belongs to the authenticated user
    const interview = await prisma.interview.findUnique({
      where: {
        id: interview_id,
        user_id: userId
      },
      select: { id: true }
    });

    if (!interview) {
      return NextResponse.json({
        error: "Interview not found or access denied",
        code: "NOT_FOUND"
      }, { status: 404 });
    }

    const result = await getRemainingTime(interview_id);

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Get remaining time error:', err);
    return NextResponse.json({
      error: err.message || "Failed to get remaining time",
      code: "INTERNAL_SERVER_ERROR"
    }, { status: 500 });
  }
}

import { sendTavusMessage } from "@/lib/tavus";

/**
 * POST /api/interviews/time
 * 
 * Triggers a time-based warning/message to the AI interviewer.
 * Used for 30s and 15s warnings.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { interview_id, message, type } = body;

    if (!interview_id || !message) {
      return NextResponse.json({ error: "Missing interview_id or message" }, { status: 400 });
    }

    // Verify interview ownership
    const interview = await prisma.interview.findUnique({
      where: {
        id: interview_id,
        user_id: userId
      },
      select: { conversation_id: true }
    });

    if (!interview || !interview.conversation_id) {
      return NextResponse.json({ error: "Interview not found or invalid" }, { status: 404 });
    }

    // If this is the "start" message (User Joined), activate the interview clock
    if (type === 'start') {
      console.log(`Activating interview ${interview_id} clock...`);
      await prisma.interview.update({
        where: { id: interview_id },
        data: {
          status: 'ACTIVE',
          start_time: new Date()
        }
      });
    }

    // Send message to Tavus
    console.log(`Sending time warning to interview ${interview_id}: ${message}`);
    await sendTavusMessage(interview.conversation_id, message);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Time warning error:', err);
    return NextResponse.json({ error: err.message || "Failed to send warning" }, { status: 500 });
  }
}
