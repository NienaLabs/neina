'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/auth-client';
import { Conversation } from '@/components/cvi/components/conversation';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
import { useDaily } from '@daily-co/daily-react';
import { useSidebar } from '@/components/ui/sidebar';
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
import { FeatureGuide } from '@/components/FeatureGuide';

type TavusConversationResponse = {
  conversation_id?: string;
  url?: string;
  error?: string;
};

// VideoCallComponent that uses useDailyCall inside CVIProvider
const VideoCallComponent = React.memo(({
  meetingUrl,
  role,
  interviewId,
  onLeave,
  onTimeExpired,
  onWarning
}: {
  meetingUrl: string;
  role?: string;
  interviewId?: string;
  onLeave: () => Promise<void>;
  onTimeExpired?: () => void;
  onWarning?: (level: 'low' | 'critical') => void;
}) => {
  return (
    <Conversation
      meetingUrl={meetingUrl}
      role={role}
      interviewId={interviewId}
      onLeave={onLeave}
      onTimeExpired={onTimeExpired}
      onWarning={onWarning}
    />
  );
});

const VideoInterview = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setOpen: setSidebarOpen } = useSidebar();

  // State
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  const [lastInterviewId, setLastInterviewId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [showTimeWarning, setShowTimeWarning] = useState<string>('');
  const [useResume, setUseResume] = useState(false);

  // Fetch resumes to check if any exist
  const { data: resumes } = trpc.resume.getPrimaryResumes.useQuery();
  const hasResume = resumes && resumes.length > 0;

  // Set useResume to true by default if user has a resume
  useEffect(() => {
    if (hasResume) {
      setUseResume(true);
    }
  }, [hasResume]);

  // ADDED: Ref to track if we're currently ending to prevent duplicate calls
  const isEndingRef = useRef(false);

  // Connection timeout monitor
  useEffect(() => {
    if (!isConnecting || !connectionStartTime) return;

    const timer = setInterval(() => {
      if (Date.now() - connectionStartTime > 30000) {
        setHasTimedOut(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnecting, connectionStartTime]);

  // Handle Sidebar state based on conversation state
  useEffect(() => {
    if (conversationUrl) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [conversationUrl, setSidebarOpen]);

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
          useResume: hasResume ? useResume : false,
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

  // Consolidate cleanup logic to avoid duplication and guard conflicts
  const performCleanup = useCallback(() => {
    setConversationUrl(null);
    setConversationId(null);
    if (interviewId) setLastInterviewId(interviewId);
    setInterviewId(null);
    setConversationState('ended');
    isEndingRef.current = false;
    console.log('Interview cleanup complete');
  }, [interviewId]);

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
      performCleanup();
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

    // FIXED: Immediately set refs and state to prevent re-entry
    if (isEndingRef.current) {
      console.log('Already ending interview, skipping');
      return;
    }

    isEndingRef.current = true;
    setConversationState('ending');

    console.log('Time expired, ending interview immediately...');

    // 1. Immediately transition UI to ended state
    // We don't wait for backend to transition the UI - better UX
    performCleanup();

    // 2. Trigger backend cleanup in the background
    if (interviewId) {
      console.log(`Timeout cleanup: Triggering background force-end for ${interviewId}...`);
      fetch('/api/interviews/force-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId })
      }).catch(err => console.warn('Background force-end failed:', err));
    }

    // Always clean up local UI state
    setIsEnding(false);
    setShowTimeWarning('');
  }, [interviewId, conversationState, performCleanup]); // Removed dailyCall dependency as it was null here anyway

  // Handle time warnings and trigger AI speech
  const handleTimeWarning = useCallback((level: 'low' | 'critical') => {
    // Only proceed if we have an interview ID
    if (!interviewId) return;

    let message = "";
    let uiMessage = "";

    if (level === 'critical') { // ~12 seconds left (triggered by InterviewTimer)
      uiMessage = 'Critical: Time is ending!';
      // Explicit instruction to say goodbye immediately
      message = "URGENT: The interview time is ending now. Stop asking questions. Say goodbye and wrap up the call immediately.";
    } else { // ~30 seconds left
      uiMessage = 'Warning: 30 seconds remaining';
      message = "We have about 30 seconds left. Please inform the user.";
    }

    setShowTimeWarning(uiMessage);

    // Trigger AI speech via Daily Data Channel (Tavus Interactions Protocol)
    if (dailyCall) {
      console.log(`Sending ${level} warning to AI via Data Channel:`, message);

      // LAYER 2: INTERRUPT (Only for critical wrap-up)
      // If the AI is mid-sentence, this forces it to stop and listen to the next command immediately.
      if (level === 'critical') {
        dailyCall.sendAppMessage(
          {
            event_type: 'conversation.interrupt',
            conversation_id: conversationId // Correct Tavus ID
          },
          '*'
        );
      }

      // Then send the response command
      dailyCall.sendAppMessage(
        {
          event_type: 'conversation.respond',
          properties: {
            text: message
          },
          conversation_id: conversationId // Correct Tavus ID
        },
        '*' // Send to all participants (the AI will pick it up)
      );
    }

    // Clear warning after 5 seconds
    setTimeout(() => setShowTimeWarning(''), 5000);
  }, [interviewId, dailyCall, conversationId]);

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

  const handleGenerateReport = async () => {
    const idToAnalyze = interviewId || lastInterviewId;
    if (!idToAnalyze) {
      toast.error('No interview found to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch(`/api/interviews/${idToAnalyze}/analyze`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.status === 422) {
        // Transcript not ready
        setAnalysisError(data.error || 'Transcript not ready. Please wait a moment and try again.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      toast.success('Report generated successfully!');
      router.push(`/interviews/${idToAnalyze}/result`);
    } catch (error) {
      console.error('Report generation error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 flex flex-col transition-all duration-500">
      {/* Header with camera toggle - hidden when active for professional look */}
      {!conversationUrl && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shrink-0 animate-in fade-in slide-in-from-top duration-500">
          <div className="max-w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Video Interview</h1>
                <FeatureGuide
                  title="AI Interview"
                  description="Real-time video interview practice with an AI avatar. Your performance will be analyzed for content, tone, and pacing."
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connect with our AI interviewer for a face-to-face conversation
              </p>
              {interviewId && (
                <div className="mt-2">
                  <InterviewTimer
                    interviewId={interviewId}
                    initialSeconds={remainingSeconds}
                    tavusId={conversationId || undefined}
                    onTimeExpired={handleTimeExpired}
                    onWarning={handleTimeWarning}
                    dailyCall={dailyCall}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
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
      )}

      <div className={`relative flex-1 bg-gray-900 overflow-hidden min-h-0 ${conversationUrl ? 'rounded-none' : 'm-0 md:m-4 rounded-none md:rounded-2xl'} shadow-2xl transition-all duration-700`}>
        {conversationUrl ? (
          <CVIProvider meetingUrl={conversationUrl}>
            <VideoCallComponent
              meetingUrl={conversationUrl}
              role={userRole}
              interviewId={interviewId || undefined}
              onTimeExpired={handleTimeExpired}
              onWarning={handleTimeWarning}
              onLeave={endConversation}
            />
          </CVIProvider>
        ) : conversationState === 'ended' || conversationState === 'ending' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 animate-in fade-in zoom-in duration-500">
            <div className="max-w-md w-full mx-auto p-8 rounded-3xl bg-gray-800/50 backdrop-blur-xl border border-white/10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Interview Completed!</h2>
              <p className="text-gray-400 mb-8">
                Great job on completing your practice session. Would you like to generate an AI performance report now?
              </p>

              {analysisError && (
                <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold rounded-2xl transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Generate AI Report'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  disabled={isAnalyzing}
                  className="w-full text-gray-400 hover:text-white hover:bg-white/5 h-12 rounded-2xl"
                >
                  Return to Dashboard
                </Button>
              </div>

              <p className="mt-6 text-xs text-gray-500 italic">
                {isAnalyzing ? "Our AI is reviewing your transcript, tone, and pacing..." : "Note: AI analysis may take a few moments to become available after the call ends."}
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center w-full px-4">
              {isConnecting ? (
                <>
                  <Loader2 className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-gray-400 text-lg md:text-xl">Connecting to AI Interviewer...</p>
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
                  <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Video className="h-16 w-16 md:h-24 md:w-24 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-xl md:text-2xl mb-2">AI Interviewer</p>
                  <p className="text-gray-500 text-base md:text-lg">Click "Start Interview" to begin</p>
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
        <DialogContent className="w-[95%] sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
                Interview Context <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                placeholder="Example job description..."
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 Adding a job description helps the AI ask more relevant questions
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2 py-2 border-t border-b">
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="use-resume" className="text-base font-medium">Use My Resume</Label>
                <p className="text-xs text-muted-foreground">
                  Give AI access to your primary resume for better context
                </p>
              </div>
              <Switch
                id="use-resume"
                checked={useResume}
                onCheckedChange={setUseResume}
                disabled={!hasResume}
              />
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
                disabled={!userRole.trim() || !userDescription.trim() || isConnecting}
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
