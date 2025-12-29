'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InterviewTimerProps {
  interviewId: string; // The internal DB ID (used for polling)
  tavusId?: string;    // The external Tavus ID (used for Data Channel messaging)
  initialSeconds?: number; // Optional initial time to prevent 'Syncing' lag
  dailyCall?: any; // Daily call object for WebRTC messages
  onTimeExpired?: () => void;
  onWarning?: (level: 'low' | 'critical') => void;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  interviewId,
  tavusId,
  initialSeconds,
  dailyCall,
  onTimeExpired,
  onWarning
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(initialSeconds ?? null);
  const [warningLevel, setWarningLevel] = useState<'low' | 'critical' | null>(null);

  // Use refs for tracking warnings to avoid stale closures in the polling loop
  const warnedLowRef = React.useRef(false);
  const warnedCriticalRef = React.useRef(false);
  const hasTriggeredEndRef = React.useRef(false);

  // Sync state with refs for UI display if needed, but logic uses refs
  const [hasEnded, setHasEnded] = useState(false);


  useEffect(() => {
    if (hasEnded) return;

    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;

    const checkTime = async () => {
      if (!isMounted || !interviewId || hasEnded) {
        if (process.env.NODE_ENV === 'development' && !hasEnded && interviewId) {
          console.log('[Timer] Polling cycle skipped:', { isMounted, hasInterviewId: !!interviewId, hasEnded });
        }
        return;
      }

      try {
        const response = await fetch(`/api/interviews/time?interview_id=${interviewId}`, {
          cache: 'no-store'
        });

        if (!isMounted || hasEnded) return;

        if (response.ok) {
          const data = await response.json();

          if (process.env.NODE_ENV === 'development') {
            console.log(`[Timer] API Data: ${data.remaining_seconds}s, should_end: ${data.should_end}`);
          }

          setRemainingSeconds(data.remaining_seconds);

          if (data.should_end && !hasTriggeredEndRef.current) {
            hasTriggeredEndRef.current = true;
            setHasEnded(true);
            if (onTimeExpired) {
              console.log("[Timer] Hit zero, triggering onTimeExpired handler");
              onTimeExpired();
            } else {
              console.warn("[Timer] Hit zero but onTimeExpired handler is missing!");
            }
            return;
          }

          if (data.remaining_seconds > 0 && !data.should_end) {
            const currentSeconds = data.remaining_seconds;
            // User requested range 12-9s. Triggering at <= 12 ensures we catch it early.
            // User requested range 12-9s. Triggering at <= 12 ensures we catch it early.
            if (currentSeconds <= 12 && !warnedCriticalRef.current) {
              warnedCriticalRef.current = true;
              if (onWarning) onWarning('critical');
            } else if (currentSeconds <= 30 && currentSeconds > 12 && !warnedLowRef.current) {
              warnedLowRef.current = true;
              if (onWarning) onWarning('low');
            }
          }

          if (data.warning_level !== warningLevel) {
            setWarningLevel(data.warning_level || null);
          }
        } else {
          console.error(`[Timer] API Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('[Timer] Fetch error:', error);
      } finally {
        // Schedule next check only after the current one completes
        if (isMounted && !hasEnded) {
          timerId = setTimeout(checkTime, 1000);
        }
      }
    };

    // Initial check
    timerId = setTimeout(checkTime, 100);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
    // Dependencies removed: dailyCall, onTimeExpired, onWarning to prevent infinite effect restart loops
    // We access them via closure which is safe as they are expected to be stable or the effect re-runs if interviewId/hasEnded change
  }, [interviewId, hasEnded]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (remainingSeconds === null) return 'text-gray-400';
    if (remainingSeconds <= 10) return 'text-red-500';
    if (remainingSeconds <= 15) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <Clock className={`h-4 w-4 ${remainingSeconds === null ? 'text-gray-400' : getTimerColor()}`} />
      <span className={`font-medium ${remainingSeconds === null ? 'text-gray-400' : getTimerColor()}`}>
        {remainingSeconds === null ? 'Syncing...' : `${formatTime(remainingSeconds)} remaining`}
      </span>

      {warningLevel === 'critical' && (
        <Alert className="ml-4 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Time running out! Interview will end in {remainingSeconds ?? 0} seconds.
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