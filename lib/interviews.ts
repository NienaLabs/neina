import prisma from '@/lib/prisma';

export interface InterviewData {
  user_id: string;
  role?: string;
  description?: string;
  conversation_id?: string;
  conversation_url?: string;
  resume_id?: string;
}


export interface InterviewStartResult {
  interview: {
    id: string | null;
    start_time: Date;
    remaining_seconds: number;
    conversation_url?: string | null;
    conversation_id?: string;
  };

  has_sufficient_time: boolean;
  warning?: string;
}

export interface InterviewEndResult {
  interview: {
    id: string;
    duration_seconds: number;
    end_time: Date;
    status: string;
  };
  remaining_seconds: number;
}

// Start an interview and validate user has sufficient time
export async function startInterview(data: InterviewData): Promise<InterviewStartResult> {
  // Get user with remaining minutes
  const user = await prisma.user.findUnique({
    where: { id: data.user_id },
    select: { interview_minutes: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has sufficient time (at least 30 seconds)
  // interview_minutes is stored in MINUTES. Require at least 0.5 minutes (30 seconds).
  if (user.interview_minutes < 0.5) {
    return {
      interview: {
        id: null,
        start_time: new Date(),
        remaining_seconds: Math.max(0, Math.floor(user.interview_minutes * 60)),
        conversation_url: null
      },

      has_sufficient_time: false,
      warning: `No credits left. Please purchase more minutes to continue.`
    };
  }

  // Check for existing active interview
  const existingInterview = await prisma.interview.findFirst({
    where: {
      user_id: data.user_id,
      status: 'ACTIVE'
    }
  });

  if (existingInterview) {
    throw new Error('User already has an active interview');
  }

  // Create interview record
  const conversation_id = data.conversation_id;

  // Validate conversation_id format (should be a UUID-like string)
  if (!conversation_id || conversation_id.length < 10) {
    throw new Error("Invalid conversation_id format");
  }

  const interview = await prisma.interview.create({
    data: {
      user_id: data.user_id,
      role: data.role,
      description: data.description,
      conversation_id: conversation_id,
      resume_id: data.resume_id,
      status: 'SCHEDULED' // Initially scheduled, timer doesn't run yet
    }
  });

  return {
    interview: {
      id: interview.id,
      start_time: interview.start_time,
      // convert minutes -> seconds for API response
      remaining_seconds: Math.max(0, Math.floor(user.interview_minutes * 60)),
      conversation_url: data.conversation_url,
      conversation_id: interview.conversation_id || undefined
    },

    has_sufficient_time: true
  };
}

// End interview and calculate used time
export async function endInterview(interviewId: string, userId: string, transcript?: any): Promise<InterviewEndResult> {
  // Fetch interview and user data in parallel
  const [interview, user] = await Promise.all([
    prisma.interview.findUnique({
      where: { id: interviewId }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { interview_minutes: true }
    })
  ]);

  if (!interview) {
    throw new Error('Interview not found');
  }

  if (interview.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  if (!user) {
    throw new Error('User not found');
  }

  // If already ended, just return what we have (though this should be handled by caller)
  if (interview.status === 'ENDED' || interview.status === 'ANALYZED') {
    return {
      interview: {
        id: interview.id,
        duration_seconds: interview.duration_seconds,
        end_time: interview.end_time || new Date(),
        status: interview.status
      },
      remaining_seconds: Math.max(0, Math.floor(user.interview_minutes * 60))
    };
  }

  // We allow ending from SCHEDULED or ACTIVE. 
  // If SCHEDULED, duration is 0.
  const endTime = new Date();
  let durationSeconds = 0;

  if (interview.status === 'ACTIVE' && interview.start_time) {
    durationSeconds = Math.floor((endTime.getTime() - interview.start_time.getTime()) / 1000);
  } else if (interview.status === 'SCHEDULED') {
    console.log(`[endInterview] Ending scheduled interview ${interviewId} - setting duration to 0`);
  } else {
    // Other statuses like TIMEOUT, CANCELLED might still be valid to "end" but usually they are terminal.
    console.warn(`[endInterview] Interview ${interviewId} is in status ${interview.status}. Proceeding to mark as ENDED.`);
  }

  // Protect against negative or NaN duration
  if (isNaN(durationSeconds) || durationSeconds < 0) durationSeconds = 0;

  // Update interview record
  console.log(`[endInterview] Updating interview ${interviewId} to ENDED...`);
  let updatedInterview;
  try {
    updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        end_time: endTime,
        duration_seconds: durationSeconds,
        status: 'ENDED',
        transcript: transcript || undefined // Save transcript if provided
      }
    });
  } catch (dbErr: any) {
    console.error(`[endInterview] Failed to update interview ${interviewId}:`, dbErr);
    throw dbErr;
  }

  // Atomic update: decrement interview_minutes but never below 0
  const usedMinutes = Math.ceil(durationSeconds / 60);
  console.log(`[endInterview] Deducting ${usedMinutes} minutes from user ${userId}...`);

  let updatedUser;
  try {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        interview_minutes: {
          decrement: usedMinutes
        }
      },
      select: { interview_minutes: true }
    });
  } catch (userErr: any) {
    console.error(`[endInterview] Failed to update user minutes for ${userId}:`, userErr);
    throw userErr;
  }

  // Ensure interview_minutes never goes below 0
  if (updatedUser.interview_minutes < 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { interview_minutes: 0 }
    });
    updatedUser.interview_minutes = 0;
  }

  return {
    interview: {
      id: updatedInterview.id,
      duration_seconds: updatedInterview.duration_seconds,
      end_time: updatedInterview.end_time!,
      status: updatedInterview.status
    },
    remaining_seconds: Math.max(0, updatedUser.interview_minutes * 60)
  };
}

// Force end interview due to timeout
export async function forceEndInterview(interviewId: string, userId: string): Promise<InterviewEndResult> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId }
  });

  if (!interview) {
    throw new Error('Interview not found');
  }

  if (interview.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  if (interview.status !== 'ACTIVE') {
    throw new Error(`Cannot force-end interview with status: ${interview.status}`);
  }

  const endTime = new Date();
  const durationSeconds = Math.floor((endTime.getTime() - interview.start_time.getTime()) / 1000);

  // Update interview record with TIMEOUT status
  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      end_time: endTime,
      duration_seconds: durationSeconds,
      status: 'TIMEOUT'
    }
  });

  // Deduct the time used from remaining minutes
  const usedMinutes = Math.ceil(durationSeconds / 60);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      interview_minutes: {
        decrement: usedMinutes
      }
    },
    select: { interview_minutes: true }
  });

  // Ensure interview_minutes never goes below 0
  if (updatedUser.interview_minutes < 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { interview_minutes: 0 }
    });
    updatedUser.interview_minutes = 0;
  }

  return {
    interview: {
      id: updatedInterview.id,
      duration_seconds: updatedInterview.duration_seconds,
      end_time: updatedInterview.end_time!,
      status: updatedInterview.status
    },
    remaining_seconds: Math.max(0, updatedUser.interview_minutes * 60)
  };
}

// Get remaining time for active interview
export async function getRemainingTime(interviewId: string): Promise<{
  remaining_seconds: number;
  should_end: boolean;
  warning_level?: 'low' | 'critical';
}> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      user: {
        select: { interview_minutes: true }
      }
    }
  });

  if (!interview || (interview.status !== 'ACTIVE' && interview.status !== 'SCHEDULED')) {
    return { remaining_seconds: 0, should_end: true };
  }

  // If still scheduled, return the full duration (timer hasn't started)
  if (interview.status === 'SCHEDULED') {
    return {
      remaining_seconds: Math.max(0, Math.floor(interview.user.interview_minutes * 60)),
      should_end: false,
    };
  }

  const now = new Date();
  const startTime = interview.start_time;
  const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const totalAvailableSeconds = Math.floor(interview.user.interview_minutes * 60);

  // interview_minutes is in minutes; convert to seconds for countdown
  const remainingSeconds = totalAvailableSeconds - elapsedSeconds;

  if (process.env.DEBUG_API === 'true' || process.env.NODE_ENV === 'development') {
    console.log(`[TimeCheck] Interview: ${interviewId.substring(0, 8)}...`, {
      dbMinutes: interview.user.interview_minutes,
      totalSecs: totalAvailableSeconds,
      elapsedSecs: elapsedSeconds,
      remainingSecs: remainingSeconds,
      status: interview.status
    });
  }

  let warning_level: 'low' | 'critical' | undefined;
  if (remainingSeconds <= 10 && remainingSeconds > 0) {
    warning_level = 'critical';
  } else if (remainingSeconds <= 15 && remainingSeconds > 10) {
    warning_level = 'low';
  }

  return {
    remaining_seconds: Math.max(0, remainingSeconds),
    should_end: remainingSeconds <= 0,
    warning_level
  };
}
