'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InterviewTimerProps {
  interviewId: string;
  dailyCall?: any; // Daily call object for WebRTC messages
  onTimeExpired?: () => void;
  onWarning?: (level: 'low' | 'critical') => void;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  interviewId,
  dailyCall,
  onTimeExpired,
  onWarning
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [shouldEnd, setShouldEnd] = useState(false);
  const [warningLevel, setWarningLevel] = useState<'low' | 'critical' | null>(null);
  const [lastWarningSent, setLastWarningSent] = useState<number>(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Helper function to inject time context via WebRTC
  const sendAIWarning = async (timeRemaining: number) => {
    // Check if we have all required conditions to send a message
    if (!interviewId || !dailyCall || !dailyCall.joined()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Skipping AI warning - call not ready:', { 
          hasInterviewId: !!interviewId, 
          hasDailyCall: !!dailyCall,
          isJoined: dailyCall?.joined()
        });
      }
      return;
    }
    
    let contextMessage = '';
    if (timeRemaining <= 30) {
      contextMessage = "[SYSTEM: 30 seconds remaining - please announce this to the user and wrap up the conversation]";
    } else if (timeRemaining <= 60) {
      contextMessage = "[SYSTEM: 1 minute remaining - please announce this to the user and focus on concluding thoughts]";
    } else if (timeRemaining <= 120) {
      contextMessage = "[SYSTEM: 2 minutes remaining - please announce this to the user and start wrapping up]";
    } else {
      return; // No warning needed for more than 2 minutes
    }

    try {
      // Add additional safety checks before sending
      if (dailyCall && dailyCall.joined() && dailyCall.meetingState() === 'joined-meeting') {
        await dailyCall.sendAppMessage({
          message_type: "conversation",
          event_type: "conversation.respond",
          conversation_id: interviewId,
          properties: { 
            text: contextMessage,
            inject_context: true
          }
        }, '*');
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`AI warning sent for ${timeRemaining}s remaining`);
        }
      }
    } catch (error: unknown) {
      // Only log errors that aren't related to the call not being ready
      if (error instanceof Error && !error.message.includes('sendAppMessage() only supported after join')) {
        console.error('Error injecting time context:', error);
      }
    }
  };

  useEffect(() => {
    // FIXED: Don't start polling if already ended
    if (hasEnded) {
      return;
    }

    let isMounted = true;
    let checkTimeout: NodeJS.Timeout | null = null;
    
    const checkTime = async () => {
      // FIXED: Added hasEnded check to prevent processing after end
      if (!isMounted || !interviewId || hasEnded) return;
      
      try {
        const response = await fetch(`/api/interviews/time?interview_id=${interviewId}`, {
          cache: 'no-store' // Prevent caching of the time check
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          
          setRemainingSeconds(data.remaining_seconds);
          setShouldEnd(data.should_end);
          
          // Handle time expiration - only trigger once
          if (data.should_end && !hasEnded) {
            console.log('Interview should end - calling onTimeExpired');
            setHasEnded(true);
            
            if (onTimeExpired) {
              onTimeExpired();
            }
            
            return; // Exit early to stop further processing
          }
          
          // Process warnings if we have a valid call object and time remaining
          // FIXED: Only process warnings if not ended
          if (dailyCall && data.remaining_seconds > 0 && !data.should_end) {
            const currentSeconds = data.remaining_seconds;
            
            // Throttle warning checks to once per second at most
            const now = Date.now();
            const timeSinceLastWarning = now - lastWarningSent;
            
            if (timeSinceLastWarning >= 1000) { // Only send if it's been at least 1 second
              // Critical warning (last 10 seconds)
              if (currentSeconds <= 10 && lastWarningSent > 10) {
                if (onWarning) onWarning('critical');
                await sendAIWarning(currentSeconds);
                if (isMounted) setLastWarningSent(now);
              } 
              // Low warning (11-30 seconds)
              else if (currentSeconds <= 30 && lastWarningSent > 30) {
                if (onWarning) onWarning('low');
                await sendAIWarning(currentSeconds);
                if (isMounted) setLastWarningSent(now);
              }
            }
          }
          
          // Update warning level for UI
          if (data.warning_level && data.warning_level !== warningLevel) {
            setWarningLevel(data.warning_level);
          }
        }
      } catch (error) {
        console.error('Error checking time:', error);
      }
    };

    // Initial check with a small delay to allow component to mount
    checkTimeout = setTimeout(() => {
      checkTime();
    }, 100);
    
    // Set up interval for polling
    const interval = setInterval(checkTime, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [interviewId, onTimeExpired, onWarning, warningLevel, dailyCall, lastWarningSent, hasEnded]); // FIXED: Added hasEnded to dependencies

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (remainingSeconds <= 10) return 'text-red-500';
    if (remainingSeconds <= 15) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <Clock className={`h-4 w-4 ${getTimerColor()}`} />
      <span className={`font-medium ${getTimerColor()}`}>
        {formatTime(remainingSeconds)} remaining
      </span>
      
      {warningLevel === 'critical' && (
        <Alert className="ml-4 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Time running out! Interview will end in {remainingSeconds} seconds.
          </AlertDescription>
        </Alert>
      )}
      
      {warningLevel === 'low' && (
        <Alert className="ml-4 py-2 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800">
            {remainingSeconds} seconds remaining.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};