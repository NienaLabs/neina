'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/auth-client';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Loader2,
  AlertCircle,
  Clock,
  Maximize2,
  Minimize2,
  Video,
  Mic,
  MicOff,
  PhoneOff,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureGuide } from '@/components/FeatureGuide';
import { InterviewTimer } from '@/components/interview-timer';
import { interviewerSystemPrompt } from '@/constants/prompts';

// Dynamic import for Duix to avoid SSR issues if any
import Duix from 'duix-guiji-light';

const VideoInterview = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setOpen: setSidebarOpen } = useSidebar();

  // State
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);

  const [sessionData, setSessionData] = useState<{
    conversationId: string;
    duixSign: string;
    duixAppId: string;
    interviewId: string;
    remainingSeconds: number;
    resumeContent?: string;
  } | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [conversationState, setConversationState] = useState<'idle' | 'connecting' | 'active' | 'ending' | 'ended'>('idle');
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [userRole, setUserRole] = useState<string>('REACT Developer');
  const [userDescription, setUserDescription] = useState<string>(`Responsible for requirement analysis, Design and Development of modules. Using React and Redux, design and develop user interface components for JavaScript-based online and mobile apps. Develop new user-facing features. Build reusable code and libraries for future use. Ensure the technical feasibility of UI/UX designs. Writing application interface codes using JavaScript following react.js workflows. Review code, elicit requirements and design specifications.`);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [lastInterviewId, setLastInterviewId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [useResume, setUseResume] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const isAiSpeakingRef = useRef(false);
  const [transcript, setTranscript] = useState<{ role: string, content: string }[]>([]);

  // Refs
  const duixRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEndingRef = useRef(false);
  const lastAsrTriggerTimeRef = useRef<number>(0);
  const interviewIdRef = useRef<string | null>(null);
  const duixInitializedSessionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const conversationStateRef = useRef(conversationState);

  // Sync conversation state ref
  conversationStateRef.current = conversationState;

  // Track mount status
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Fetch resumes to check if any exist
  const { data: resumes } = trpc.resume.getPrimaryResumes.useQuery();
  const hasResume = resumes && resumes.length > 0;

  useEffect(() => {
    if (hasResume) setUseResume(true);
  }, [hasResume]);

  // Connection timeout monitor
  useEffect(() => {
    if (!isConnecting || !connectionStartTime) return;
    const timer = setInterval(() => {
      if (Date.now() - connectionStartTime > 45000) {
        setHasTimedOut(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnecting, connectionStartTime]);

  // Handle local video stream
  useEffect(() => {
    // Start local camera only when session initializes to avoid race conditions
    if (sessionData?.conversationId && !localStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Failed to get local video:', err);
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionData?.conversationId, localStream]);

  // Sync local video element with stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const toggleMic = async () => {
    if (duixRef.current && conversationState === 'active' && !isConnecting) {
      try {
        const newState = !isMicOn;
        if (newState) {
          await duixRef.current.openAsr();
        } else {
          await duixRef.current.closeAsr();
        }
        setIsMicOn(newState);
      } catch (err: any) {
        console.error('[DUIX] Failed to toggle mic:', err);
      }
    }
  };

  const endConversation = useCallback(async (source: string = 'unknown') => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    console.log(`[DUIX] endConversation triggered. Source: ${source}`);
    setConversationState('ending');
    setIsVideoOn(false);

    try {
      if (duixRef.current) {
        console.log(`[DUIX] Calling duixRef.current.stop() from endConversation (${source})`);
        duixRef.current.stop();
        duixRef.current = null;
        duixInitializedSessionIdRef.current = null;
      }

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      const interviewIdToEnd = sessionData?.interviewId;
      if (interviewIdToEnd) {
        await fetch('/api/interviews/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interview_id: interviewIdToEnd,
            transcript: transcript
          }),
        });
      }
    } catch (error) {
      console.error('Error ending interview:', error);
    } finally {
      if (sessionData?.interviewId) setLastInterviewId(sessionData.interviewId);
      setSessionData(null);
      setConversationState('ended');
      isEndingRef.current = false;
    }
  }, [sessionData, transcript, localStream]);

  const handleTimeWarning = useCallback((level: 'low' | 'critical') => {
    // We no longer call duixRef.current.speak here to keep Bella professional 
    // and avoid distracting the candidate with verbal time warnings.
    // The UI timer banner is sufficient for the user.

    fetch('/api/interviews/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interview_id: interviewIdRef.current,
        message: level === 'critical' ? '10 seconds remaining' : '30 seconds remaining',
        type: 'warning'
      }),
    }).catch(err => console.error('Failed to log time warning:', err));
  }, []); // Logic uses refs to avoid stale closures. Dependency array left empty as refs provide current values.

  const handleTimeExpired = useCallback(() => {
    toast.info("Your interview time has ended. Wrapping up...");
    endConversation('Timer (Expired)');
  }, [endConversation]);

  useEffect(() => {
    setSidebarOpen(!sessionData?.conversationId);
  }, [sessionData?.conversationId, setSidebarOpen]);

  // Handle video auto-resume when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && duixRef.current && conversationState === 'active') {
        console.log('[DUIX] Tab visible, resuming video...');
        duixRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [conversationState]);

  // Duix Initialization
  useEffect(() => {
    if (conversationState === 'active' && sessionData && !duixRef.current) {
      // Prevent double initialization if we're already set up for this session
      if (duixInitializedSessionIdRef.current === sessionData.conversationId) {
        console.log('[DUIX] Already initialized for session:', sessionData.conversationId);
        return;
      }

      const containerNode = document.getElementById('duix-container');
      if (!containerNode) return;

      console.log('[DUIX] Initializing new session:', sessionData.conversationId);
      const duix = new Duix();
      duixRef.current = duix;
      duixInitializedSessionIdRef.current = sessionData.conversationId;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('_duix_sign', sessionData.duixSign);
      }

      duix.on('error', (err: any) => {
        console.error('DUIX Error:', err);
        if (err.code === 4005) toast.error('Authentication failed.');
      });

      duix.on('show', () => {
        console.log('[DUIX] Avatar is now VISIBLE (show event)');
        setIsAvatarVisible(true);

        // Signal start to the backend
        fetch('/api/interviews/time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interview_id: interviewIdRef.current,
            message: "User joined",
            type: 'start'
          }),
        }).catch(err => console.error('Failed to send start event:', err));
      });

      // Debugging events for stability (minimal)
      duix.on('render', (data: any) => console.log('[DUIX] Render event'));
      duix.on('playStart', () => console.log('[DUIX] playStart event'));
      duix.on('mqttConnect', () => console.log('[DUIX] MQTT Connected'));

      duix.on('asrData', (data: any) => {
        const text = data.text || data.content;
        if (text) {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'user' && last.content === text) return prev;
            if (last && last.role === 'user') {
              const newTranscript = [...prev];
              newTranscript[newTranscript.length - 1] = { role: 'user', content: text };
              return newTranscript;
            }
            return [...prev, { role: 'user', content: text }];
          });
        }
      });

      duix.on('asrStop', () => {
        const now = Date.now();
        if (now - lastAsrTriggerTimeRef.current < 2000) return;
        if (isAiSpeakingRef.current) return;
        lastAsrTriggerTimeRef.current = now;
      });

      const handleAiPartial = (data: any) => {
        const text = data.text || data.content;
        if (!text) return;
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'interviewer' && last.content === text) return prev;
          if (last && last.role === 'interviewer') {
            const newTranscript = [...prev];
            newTranscript[newTranscript.length - 1] = { role: 'interviewer', content: text };
            return newTranscript;
          }
          return [...prev, { role: 'interviewer', content: text }];
        });
      };

      duix.on('speakSection', handleAiPartial);

      duix.on('speakStart', (data: any) => {
        setIsAiSpeaking(true);
        isAiSpeakingRef.current = true;
        const text = data.text || data.content;
        if (text) {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'interviewer' && (last.content === text || text.startsWith(last.content))) {
              const newTranscript = [...prev];
              newTranscript[newTranscript.length - 1] = { role: 'interviewer', content: text };
              return newTranscript;
            }
            return [...prev, { role: 'interviewer', content: text }];
          });
        }
      });

      const stopAi = () => {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      };
      duix.on('speakEnd', stopAi);
      duix.on('speakStop', stopAi);

      duix.on('initialSucccess', () => {
        setTimeout(() => {
          if (!duixRef.current || duixInitializedSessionIdRef.current !== sessionData.conversationId) return;
          const dynamicPrompt = interviewerSystemPrompt(userRole, userDescription, sessionData.resumeContent);

          console.log('[DUIX] Starting SDK with dynamic prompt:', userRole);
          duixRef.current.start({
            openAsr: true,
            muted: false, // Reverting to false since manual unmuting failed
            enableLLM: 1,
            vadSilenceTime: 1500,
            extraPrompt: dynamicPrompt
          }).then(() => {
            setIsConnecting(false);
            setIsMicOn(true);
          }).catch((err: any) => {
            console.error('Start failed:', err);
            setConversationState('idle');
            setIsConnecting(false);
          });
        }, 500);
      });

      try {
        duix.init({
          sign: sessionData.duixSign,
          containerLable: '#duix-container',
          conversationId: sessionData.conversationId,
          platform: 'duix.com'
        } as any);
      } catch (err) {
        console.error('Init failure:', err);
      }

      return () => {
        // Use refs to check latest state in cleanup
        const isTearingDown = !isMountedRef.current ||
          isEndingRef.current ||
          conversationStateRef.current === 'ending' ||
          conversationStateRef.current === 'ended';

        if (duixRef.current && isTearingDown) {
          console.log('[DUIX] Session stopping:', duixInitializedSessionIdRef.current);
          duixRef.current.stop();
          duixRef.current = null;
          duixInitializedSessionIdRef.current = null;
        }
      };
    }
  }, [conversationState, sessionData?.conversationId, sessionData?.duixSign]);

  const createConversation = async (role: string, description?: string) => {
    if (isConnecting || conversationState === 'connecting' || conversationState === 'active') return;

    setIsConnecting(true);
    setConversationState('connecting');
    setConnectionStartTime(Date.now());
    setHasTimedOut(false);
    setTranscript([]);

    try {
      const response = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, description, useResume: hasResume ? useResume : false }),
      });

      const startData = await response.json();
      if (!response.ok) {
        toast.error(startData.error || 'Failed to start interview');
        setConversationState('idle');
        return;
      }

      setSessionData({
        conversationId: startData.conversation_id,
        duixSign: startData.duix_sign,
        duixAppId: startData.duix_app_id,
        interviewId: startData.interview_id,
        remainingSeconds: startData.remaining_seconds,
        resumeContent: startData.resume_content
      });
      interviewIdRef.current = startData.interview_id;
      setConversationState('active');
    } catch (err) {
      toast.error('Failed to start interview');
      setConversationState('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRoleSubmit = async () => {
    if (userRole.trim()) {
      setShowRoleDialog(false);
      await createConversation(userRole.trim(), userDescription.trim());
    }
  };

  const handleGenerateReport = async () => {
    const idToAnalyze = sessionData?.interviewId || lastInterviewId;
    if (!idToAnalyze) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch(`/api/interviews/${idToAnalyze}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');
      router.push(`/interviews/${idToAnalyze}/result`);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analysis error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 flex flex-col transition-all duration-500">
      {!sessionData?.conversationId && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shrink-0">
          <div className="max-w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Video Interview</h1>
                <FeatureGuide title="Duix AI Interview" description="Practice with a Duix AI avatar." />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connect for a face-to-face conversation</p>
            </div>
            <Button variant="default" size="sm" onClick={() => setShowRoleDialog(true)} disabled={isConnecting}>
              {isConnecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</> : <><Video className="h-4 w-4 mr-2" />Start Interview</>}
            </Button>
          </div>
        </div>
      )}

      <div className={`relative flex-1 bg-gray-900 overflow-hidden ${sessionData?.conversationId ? 'm-0' : 'm-4 rounded-2xl'} shadow-2xl`}>
        {sessionData?.conversationId ? (
          <div className="w-full h-full relative">
            <div id="duix-container" className="w-full h-full bg-black min-h-[400px]"></div>

            <div className="absolute top-24 right-6 w-40 h-52 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-40 bg-gray-950">
              {localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror-mode" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500">
                  <User className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-[10px] uppercase tracking-wider font-semibold opacity-30">No Camera</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/80 font-medium">You</div>
            </div>

            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
              <div className="bg-gray-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 pointer-events-auto">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center"><User className="h-4 w-4 text-blue-500" /></div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{userRole || "Practice Session"}</p>
                    <p className="text-[10px] text-gray-400">Live AI Interview</p>
                  </div>
                </div>
              </div>

              {sessionData?.interviewId && (
                <div className="bg-gray-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 pointer-events-auto">
                  {isAvatarVisible ? (
                    <InterviewTimer interviewId={sessionData.interviewId} initialSeconds={sessionData.remainingSeconds} onTimeExpired={handleTimeExpired} onWarning={handleTimeWarning} />
                  ) : (
                    <div className="flex items-center space-x-2 text-white/60"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs font-medium">Initializing...</span></div>
                  )}
                </div>
              )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-full bg-gray-900/40 backdrop-blur-md border border-white/10" onClick={() => duixRef.current?.resume()}><Maximize2 className="h-4 w-4 text-white" /></Button>
              <Button variant={isMicOn ? "secondary" : "destructive"} size="icon" className="w-14 h-14 rounded-full shadow-lg" onClick={toggleMic}>{isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}</Button>
              <Button variant="destructive" size="icon" className="w-14 h-14 rounded-full shadow-lg" onClick={() => endConversation('User Hangup')}><PhoneOff className="h-6 w-6" /></Button>
            </div>
          </div>
        ) : (conversationState === 'ended' || conversationState === 'ending') ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full mx-auto p-8 rounded-3xl bg-gray-800/50 backdrop-blur-xl border border-white/10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="h-10 w-10 text-green-500" /></div>
              <h2 className="text-2xl font-bold text-white mb-2">Interview Completed!</h2>
              <p className="text-gray-400 mb-8">Great job on completing your practice session.</p>
              {analysisError && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{analysisError}</AlertDescription></Alert>}
              <div className="flex flex-col gap-3">
                <Button onClick={handleGenerateReport} disabled={isAnalyzing} className="w-full bg-blue-600 h-12 rounded-2xl">{isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate AI Report'}</Button>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} disabled={isAnalyzing} className="w-full text-gray-400">Return to Dashboard</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center w-full">
              {isConnecting ? (
                <><Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-spin" /><p className="text-gray-400 text-xl">Connecting...</p></>
              ) : (
                <><div className="w-48 h-48 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center"><Video className="h-24 w-24 text-gray-500" /></div><p className="text-gray-400 text-2xl">AI Interviewer</p></>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tell us about the role</DialogTitle>
            <DialogDescription>Provide details so Bella can tailor the interview.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="role">Role Position *</Label><Input id="role" value={userRole} onChange={e => setUserRole(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="description">Interview Context *</Label><textarea id="description" value={userDescription} onChange={e => setUserDescription(e.target.value)} className="w-full min-h-[120px] rounded-md border p-2 text-sm" /></div>
            <div className="flex items-center justify-between"><Label htmlFor="use-resume">Use My Resume</Label><Switch id="use-resume" checked={useResume} onCheckedChange={setUseResume} disabled={!hasResume} /></div>
            <div className="flex justify-end gap-3 pt-4"><Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button><Button onClick={handleRoleSubmit} disabled={!userRole.trim() || isConnecting}>Start</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        #duix-container video { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
        .mirror-mode { transform: scaleX(-1); }
      `}</style>
    </div>
  );
};

export default VideoInterview;
