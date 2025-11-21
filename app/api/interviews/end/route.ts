import { NextResponse } from "next/server";
import { endInterview } from "@/lib/interviews";
import { endTavusConversation } from "@/lib/tavus";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const DEBUG_LOGGING = process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true';
  
  try {
    const { interview_id } = await request.json();
    
    if (DEBUG_LOGGING) {
      const interviewIdShort = interview_id ? `${interview_id.substring(0, 8)}...` : 'none';
      console.log(`[DEBUG] End interview request received: ${interviewIdShort}`);
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
        message: `Interview was already ${interview.status.toLowerCase()}`
      });
    }

    // End Tavus conversation FIRST before updating database
    let tavusEndResult: { success: boolean; alreadyEnded: boolean } | null = null;
    if (interview.conversation_id) {
      try {
        if (DEBUG_LOGGING) {
          const conversationIdShort = interview.conversation_id.substring(0, 8) + '...';
          console.log(`[DEBUG] End: Attempting to end Tavus conversation: ${conversationIdShort}`);
        }
        tavusEndResult = await endTavusConversation(interview.conversation_id);
        if (DEBUG_LOGGING) {
          console.log('[DEBUG] End: Tavus conversation ended:', tavusEndResult);
        }
      } catch (error: any) {
        console.error('[ERROR] End: Failed to end Tavus conversation:', error);
        // CRITICAL: If Tavus fails, don't update database to prevent mismatch
        return NextResponse.json({ 
          error: "Failed to end Tavus conversation. Interview not marked as ended to prevent state mismatch.",
          code: "TAVUS_END_FAILED",
          details: DEBUG_LOGGING ? error.message : undefined
        }, { status: 500 });
      }
    } else if (DEBUG_LOGGING) {
      const interviewIdShort = interview_id.substring(0, 8) + '...';
      console.warn(`[DEBUG] End: No conversation_id found for interview: ${interviewIdShort}`);
    }

    // Now end the interview in database
    if (DEBUG_LOGGING) {
      console.log(`[DEBUG] Calling endInterview with:`, { 
        interview_id: `${interview_id.substring(0, 8)}...`, 
        userId 
      });
    }
    
    const result = await endInterview(interview_id, userId);
    
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
    if (DEBUG_LOGGING) {
      console.error('[DEBUG] End interview error:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        ...(err.response ? { response: err.response } : {})
      });
    } else {
      console.error('End interview error:', err.message);
    }
    
    return NextResponse.json({ 
      error: "Failed to end interview",
      code: "INTERNAL_SERVER_ERROR",
      details: DEBUG_LOGGING ? err.message : undefined
    }, { status: 500 });
  }
}
