import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();

export interface InterviewData {
  user_id: string;
  role?: string;
  description?: string;
  conversation_id?: string;
}

export interface InterviewStartResult {
  interview: {
    id: string | null;
    start_time: Date;
    remaining_seconds: number;
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
    select: { remaining_minutes: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has sufficient time (at least 30 seconds)
  // remaining_minutes is stored in MINUTES. Require at least 0.5 minutes (30 seconds).
  if (user.remaining_minutes < 0.5) {
    return {
      interview: { id: null, start_time: new Date(), remaining_seconds: Math.max(0, Math.floor(user.remaining_minutes * 60)) },
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
      status: 'ACTIVE'
    }
  });

  return {
    interview: {
      id: interview.id,
      start_time: interview.start_time,
      // convert minutes -> seconds for API response
      remaining_seconds: Math.max(0, Math.floor(user.remaining_minutes * 60))
    },
    has_sufficient_time: true
  };
}

// End interview and calculate used time
export async function endInterview(interviewId: string, userId: string): Promise<InterviewEndResult> {
  // Fetch interview and user data in parallel
  const [interview, user] = await Promise.all([
    prisma.interview.findUnique({
      where: { id: interviewId }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { remaining_minutes: true }
    })
  ]);

  if (!interview) {
    throw new Error('Interview not found');
  }

  if (interview.status !== 'ACTIVE') {
    throw new Error(`Cannot end interview with status: ${interview.status}`);
  }

  if (interview.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  if (!user) {
    throw new Error('User not found');
  }

  const endTime = new Date();
  const durationSeconds = Math.floor((endTime.getTime() - interview.start_time.getTime()) / 1000);

  // Update interview record
  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      end_time: endTime,
      duration_seconds: durationSeconds,
      status: 'ENDED'
    }
  });

  // Atomic update: decrement remaining_minutes but never below 0
  const usedMinutes = Math.ceil(durationSeconds / 60);
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      remaining_minutes: {
        decrement: usedMinutes
      }
    },
    select: { remaining_minutes: true }
  });
  
  // Ensure remaining_minutes never goes below 0
  if (updatedUser.remaining_minutes < 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { remaining_minutes: 0 }
    });
    updatedUser.remaining_minutes = 0;
  }

  return {
    interview: {
      id: updatedInterview.id,
      duration_seconds: updatedInterview.duration_seconds,
      end_time: updatedInterview.end_time!,
      status: updatedInterview.status
    },
    remaining_seconds: Math.max(0, updatedUser.remaining_minutes * 60)
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
      remaining_minutes: {
        decrement: usedMinutes
      }
    },
    select: { remaining_minutes: true }
  });
  
  // Ensure remaining_minutes never goes below 0
  if (updatedUser.remaining_minutes < 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { remaining_minutes: 0 }
    });
    updatedUser.remaining_minutes = 0;
  }

  return {
    interview: {
      id: updatedInterview.id,
      duration_seconds: updatedInterview.duration_seconds,
      end_time: updatedInterview.end_time!,
      status: updatedInterview.status
    },
    remaining_seconds: Math.max(0, updatedUser.remaining_minutes * 60)
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
        select: { remaining_minutes: true }
      }
    }
  });

  if (!interview || interview.status !== 'ACTIVE') {
    return { remaining_seconds: 0, should_end: true };
  }

  const elapsedSeconds = Math.floor((new Date().getTime() - interview.start_time.getTime()) / 1000);
  
  // If user has no minutes left, don't calculate negative time
  if (interview.user.remaining_minutes <= 0) {
    return { remaining_seconds: 0, should_end: true };
  }

  // remaining_minutes is in minutes; convert to seconds for countdown
  const remainingSeconds = Math.floor(interview.user.remaining_minutes * 60) - elapsedSeconds;

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
