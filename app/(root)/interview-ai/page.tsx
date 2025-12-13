'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/auth-client';
import { Conversation } from '@/components/cvi/components/conversation';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { toast } from 'sonner';
import { useDaily } from '@daily-co/daily-react';

import { InterviewTimer } from '@/components/interview-timer';
import {
  Loader2,
  AlertCircle,
  Clock,
  Maximize2,
  Minimize2,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

type TavusConversationResponse = {
  conversation_id?: string;
  url?: string;
  error?: string;
};

// VideoCallComponent that uses useDailyCall inside CVIProvider
const VideoCallComponent = ({
  meetingUrl,
  onLeave
}: {
  meetingUrl: string;
  onLeave: () => Promise<void>;
}) => {
  // We'll use the daily object from the Conversation component's context
  // instead of directly using useDailyCall here

  return (
    <Conversation
      meetingUrl={meetingUrl}
      onLeave={onLeave}
    />
  );
};

const VideoInterview = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // State
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversationState, setConversationState] = useState<'idle' | 'connecting' | 'active' | 'ending' | 'ended'>('idle');
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userDescription, setUserDescription] = useState<string>('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [showTimeWarning, setShowTimeWarning] = useState<string>('');

  // ADDED: Ref to track if we're currently ending to prevent duplicate calls
  const isEndingRef = useRef(false);

  // Start timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      if (connectionStartTime && Date.now() - connectionStartTime > 30000) {
        setHasTimedOut(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionStartTime]);

  // Create Tavus conversation with subscription check
  const createConversation = async (role: string, description?: string) => {
    let tavusData: { conversation_id?: string } = {};

    if (isConnecting || conversationState === 'connecting' || conversationState === 'active') {
      return; // guard against duplicate starts
    }
    setIsConnecting(true);
    setConversationState('connecting');
    setConnectionStartTime(Date.now());

    setHasTimedOut(false);
    try {
      // Create interview and Tavus conversation in one go
      const response = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          description,
        }),
      });

      const startData = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          toast.error(startData.error);
          setRemainingSeconds(startData.remaining_seconds || 0);
          return;
        }

        throw new Error(startData.error || 'Failed to start interview');
      }

      setConversationUrl(startData.conversation_url);
      setConversationId(startData.conversation_id);
      setInterviewId(startData.interview_id);
      setRemainingSeconds(startData.remaining_seconds);
      setConversationState('active');
      setIsVideoOn(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start video conversation');
      setConversationState('idle');
    } finally {

      setIsConnecting(false);
    }

  };

  // Retry connection
  const retryConnection = async () => {
    if (userRole) {
      await createConversation(userRole, userDescription);
    }
  };

  // FIXED: Memoized endConversation with useCallback to prevent stale closures
  const endConversation = useCallback(async () => {
    console.log('endConversation called - ending interview...');

    // ADDED: Prevent duplicate calls using ref
    if (isEndingRef.current) {
      console.log('Already ending, skipping duplicate call');
      return;
    }

    isEndingRef.current = true;

    // First update the UI to show we're ending the call
    setConversationState('ending');
    setIsVideoOn(false);

    try {
      // End interview tracking if we have an interview ID
      if (interviewId) {
        console.log(`Calling /api/interviews/end for interview: ${interviewId}`);
        const response = await fetch('/api/interviews/end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ interview_id: interviewId }),
        });

        if (!response.ok) {
          const error = await response.json();
          // If the interview was already ended (e.g., by timeout), just log it
          if (error.error?.includes('Cannot end interview with status') ||
            error.error?.includes('already')) {
            console.log('Interview already ended with status:', error.error);
          } else {
            console.error('Failed to end interview:', error);
            throw new Error(error.error || 'Failed to end interview');
          }
        } else {
          const result = await response.json();
          console.log('Interview ended successfully:', result);
        }
      } else {
        console.log('No interview ID to end');
      }
    } catch (error) {
      // If it's an error about the interview already being ended, just log it
      if (error instanceof Error && error.message.includes('Cannot end interview with status')) {
        console.log('Interview already ended:', error.message);
      } else {
        console.error('Error ending interview:', error);
      }
      // Don't re-throw - we want to clean up state even if ending failed
    } finally {
      // Always clean up the state, even if there was an error
      setConversationUrl(null);
      setConversationId(null);
      setInterviewId(null);
      setConversationState('ended');
      isEndingRef.current = false;
    }
  }, [interviewId]); // FIXED: Only depend on interviewId

  // Toggle video with Tavus integration
  const toggleVideo = async () => {
    if (!isVideoOn) {
      setShowRoleDialog(true);
    } else {
      await endConversation();
    }
  };

  // Handle time expired
  const dailyCall = useDaily();

  const [isEnding, setIsEnding] = useState(false);

  // FIXED: Simplified handleTimeExpired with proper dependencies
  const handleTimeExpired = useCallback(async () => {
    console.log('Time expired handler called', {
      isEnding: isEndingRef.current,
      conversationState,
      interviewId
    });

    // FIXED: Simplified guard - just check if we're already ending
    if (isEndingRef.current) {
      console.log('Already ending interview, skipping');
      return;
    }

    console.log('Time expired, ending interview immediately...');

    // 1. First try to leave the call to stop any ongoing streams
    try {
      try {

        // FIXED: Check meetingState before leaving
        if (dailyCall && dailyCall.meetingState() === 'joined-meeting') {
          console.log('Leaving Daily call...');
          await dailyCall.leave();
          console.log('Successfully left Daily call');
        }
      } catch (callError) {
        console.warn('Error leaving call:', callError);
        // Continue with cleanup even if leaving fails
      }

      // 2. End the interview using the memoized function
      await endConversation();

      // 3. Force-end as backup
      if (interviewId) {
        try {
          await fetch('/api/interviews/force-end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interview_id: interviewId })
          });
        } catch (forceEndError) {
          console.warn('Error force-ending interview:', forceEndError);
        }
      }

    } catch (error) {
      console.error('Error in timeout cleanup:', error);
    } finally {
      // Always clean up state
      console.log('Final cleanup of interview state');
      setIsEnding(false);
      setShowTimeWarning('');
    }
  }, [dailyCall, endConversation, interviewId, conversationState]); // FIXED: Proper dependencies

  // Handle time warnings
  const handleTimeWarning = useCallback((level: 'low' | 'critical') => {
    if (level === 'critical') {
      setShowTimeWarning('Critical: Only 10 seconds remaining!');
    } else {
      setShowTimeWarning('Warning: 15 seconds remaining');
    }

    // Clear warning after 3 seconds
    setTimeout(() => setShowTimeWarning(''), 3000);
  }, []);

  // Handle role submission
  const handleRoleSubmit = async () => {
    if (isConnecting) return; // prevent duplicate submits
    if (userRole.trim()) {
      setShowRoleDialog(false);
      await createConversation(userRole.trim(), userDescription.trim());
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check authentication
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/sign-in');
    }
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with camera toggle */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Video Interview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect with our AI interviewer for a face-to-face conversation
            </p>
            {interviewId && (
              <div className="mt-2">
                <InterviewTimer
                  interviewId={interviewId}
                  onTimeExpired={handleTimeExpired}
                  onWarning={handleTimeWarning}
                  dailyCall={dailyCall}
                />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            {!isVideoOn && (
              <Button
                variant="default"
                size="sm"
                onClick={toggleVideo}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Video Area */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        {conversationUrl ? (
          <CVIProvider meetingUrl={conversationUrl}>
            <VideoCallComponent
              meetingUrl={conversationUrl}
              onLeave={async () => {
                try {
                  await endConversation();
                } catch (error) {
                  console.error('Error ending conversation:', error);
                  // Even if there's an error, we should reset to a clean state
                  setConversationUrl(null);
                  setConversationId(null);
                  setInterviewId(null);
                  setConversationState('idle');
                }
              }}
            />
          </CVIProvider>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              {isConnecting ? (
                <>
                  <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-gray-400 text-xl">Connecting to AI Interviewer...</p>
                  {hasTimedOut && (
                    <>
                      <p className="text-yellow-400 text-sm mt-2">Taking longer than expected...</p>
                      <Button variant="outline" size="sm" onClick={retryConnection} className="mt-3">
                        Retry Connection
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="w-48 h-48 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Video className="h-24 w-24 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-2xl mb-2">AI Interviewer</p>
                  <p className="text-gray-500 text-lg">Click "Start Interview" to begin</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Time Warning Alert */}
        {showTimeWarning && (
          <div className="absolute top-4 left-4 right-4 max-w-md mx-auto z-10">
            <Alert className={showTimeWarning.includes('Critical') ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {showTimeWarning}
              </AlertDescription>
            </Alert>
          </div>
        )}


      </div>

      {/* Role Selection Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-2xl font-semibold">
              Tell us about the role you're interviewing for
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Provide details about the position to help our AI interviewer prepare relevant questions.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-base font-medium">
                Role Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer, Product Manager"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isConnecting) handleRoleSubmit();
                  }
                }}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Job Description <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <textarea
                id="description"
                placeholder="Paste the full job description here, or add key requirements like '5 years experience with React and Node.js'..."
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 Adding a job description helps the AI ask more relevant questions
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowRoleDialog(false)}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRoleSubmit}
                disabled={!userRole.trim() || isConnecting}
                className="min-w-[140px]"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Interview'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoInterview;