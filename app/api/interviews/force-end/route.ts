import { NextResponse } from "next/server";
import { forceEndInterview } from "@/lib/interviews";
import { endTavusConversation } from "@/lib/tavus";
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

    // Get interview data with conversation_id in a single query
    const interview = await prisma.interview.findUnique({
      where: { 
        id: interview_id,
        user_id: userId // Ensure the interview belongs to the user
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

    // End Tavus conversation FIRST before updating database
    let tavusEndResult: { success: boolean; alreadyEnded: boolean } | null = null;
    if (interview.conversation_id) {
      try {
        if (DEBUG_LOGGING) {
          const conversationIdShort = interview.conversation_id.substring(0, 8) + '...';
          console.log(`[DEBUG] Force-end: Attempting to end Tavus conversation: ${conversationIdShort}`);
        }
        
        // Only try to end the Tavus conversation if it's not already ended
        if (!['ENDED', 'TIMEOUT', 'CANCELLED'].includes(interview.status)) {
          tavusEndResult = await endTavusConversation(interview.conversation_id);
          if (DEBUG_LOGGING) {
            console.log('[DEBUG] Force-end: Tavus conversation ended:', tavusEndResult);
          }
        } else if (DEBUG_LOGGING) {
          console.log('[DEBUG] Force-end: Skipping Tavus end - interview already in state:', interview.status);
        }
      } catch (error: any) {
        // If the error is because the conversation is already ended, continue
        if (error.message?.includes('already ended') || error.message?.includes('not found')) {
          if (DEBUG_LOGGING) {
            console.log('[DEBUG] Force-end: Tavus conversation already ended, continuing...');
          }
        } else {
          console.error('[ERROR] Force-end: Failed to end Tavus conversation:', error);
          // CRITICAL: If Tavus fails, don't update database to prevent mismatch
          return NextResponse.json({ 
            error: "Failed to end Tavus conversation. Interview not marked as timeout to prevent state mismatch.",
            code: "TAVUS_END_FAILED",
            details: DEBUG_LOGGING ? error.message : undefined
          }, { status: 500 });
        }
      }
    } else if (DEBUG_LOGGING) {
      const interviewIdShort = interview_id.substring(0, 8) + '...';
      console.warn(`[DEBUG] Force-end: No conversation_id found for interview: ${interviewIdShort}`);
    }

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
