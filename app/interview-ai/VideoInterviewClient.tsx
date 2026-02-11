'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/auth-client';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
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
  User,
  Sparkles,
  ArrowLeft,
  Info,
  ExternalLink,
  Expand
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
import { motion, AnimatePresence } from 'framer-motion';
import { useServerEvents } from "@/hooks/useServerEvents";

// Dynamic import for Anam to avoid SSR issues
import { createClient, type AnamClient, AnamEvent } from '@anam-ai/js-sdk';

const VideoInterview = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // State
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [warningLevel, setWarningLevel] = useState<'low' | 'critical' | null>(null);

  const [sessionData, setSessionData] = useState<{
    conversationId: string;
    anamSessionToken: string;
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
  const [showTranscript, setShowTranscript] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const isAiSpeakingRef = useRef(false);
  const [transcript, setTranscript] = useState<{ role: string, content: string }[]>([]);
  const transcriptRef = useRef<{ role: string, content: string }[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Refs
  const anamRef = useRef<AnamClient | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const anamVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEndingRef = useRef(false);
  const interviewIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const conversationStateRef = useRef(conversationState);

  // Sync conversation state ref
  conversationStateRef.current = conversationState;

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Track mount status
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Fetch resumes to check if any exist
  const { data: resumes } = trpc.resume.getPrimaryResumes.useQuery();
  const hasResume = resumes && resumes.length > 0;

  const { data: userData } = trpc.user.getMe.useQuery();

  useEffect(() => {
    if (hasResume) setUseResume(true);
  }, [hasResume]);

  const searchParams = useSearchParams();
  const urlInterviewId = searchParams.get('interviewId');
  const [isPolling, setIsPolling] = useState(false);
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(urlInterviewId);

  // Extract from URL if creating new session via redirect
  const urlRole = searchParams.get('role');
  const urlDescription = searchParams.get('description');
  const urlType = searchParams.get('type');
  const urlCount = searchParams.get('count');
  const urlResumeId = searchParams.get('resumeId');

  // Mutations/Queries
  const createSessionMutation = trpc.interview.createSession.useMutation();
  const { data: interviewData, isLoading: isLoadingInterview, refetch: refetchInterview } = trpc.interview.getInterview.useQuery(
    { interviewId: currentInterviewId! },
    {
      enabled: !!currentInterviewId,
      // refetchInterval: isPolling ? 3000 : false, // Removed in favor of SSE
    }
  );

  // Real-time update when questions are generated
  useServerEvents((event) => {
    if (event.type === 'INTERVIEW_READY' && event.data.interviewId === currentInterviewId) {
      console.log("🚀 [SSE] Interview is ready! Refreshing...");
      refetchInterview();
    }
  });

  useEffect(() => {
    // If we have URL params but no interviewId, we are in "New Session Redirect" mode
    if (!urlInterviewId && urlRole && urlDescription && isInitialLoad) {
      setUserRole(decodeURIComponent(urlRole));
      setUserDescription(decodeURIComponent(urlDescription));
      setUseResume(!!urlResumeId);
      setIsInitialLoad(false);
    } else if (interviewData && isInitialLoad) {
      setUserRole(interviewData.role || 'Position');
      setUserDescription(interviewData.description || '');
      setUseResume(!!interviewData.resume_id);
      if (interviewData.questions && Array.isArray(interviewData.questions)) {
        setQuestions(interviewData.questions as string[]);
      }
      setIsInitialLoad(false);
    }
  }, [interviewData, urlInterviewId, urlRole, urlDescription, urlResumeId, isInitialLoad]);

  // Handle Polling Completion
  useEffect(() => {
    if (interviewData && interviewData.questions && (interviewData.questions as any[]).length > 0 && isPolling) {
      setQuestions(interviewData.questions as string[]);
      setIsPolling(false);
      // After questions are ready, we can actually start the AI conversation
      startAiConversation(interviewData.id);
    }
  }, [interviewData, isPolling]);

  // Auto-open preview dialog when URL params are present
  useEffect(() => {
    if ((urlInterviewId || urlRole) && !showRoleDialog && !isPolling && !isConnecting && conversationState === 'idle') {
      setShowRoleDialog(true);
    }
  }, [urlInterviewId, urlRole, showRoleDialog, isPolling, isConnecting, conversationState]);

  // PROTECTION & REDIRECTION LOGIC
  useEffect(() => {
    // Only redirect if NOT loading and NO interview ID or Config Params are present
    if (!isPending && !isLoadingInterview && !urlInterviewId && !urlRole && isInitialLoad) {
      toast.error("Access Denied: Please select an interview role first.");
      router.push('/interview');
    }
  }, [urlInterviewId, urlRole, isPending, isLoadingInterview, router, isInitialLoad]);

  useEffect(() => {
    if (userData && userData.plan !== 'DIAMOND' && userData.role !== 'admin') {
      toast.error("Premium access required. Please upgrade to the Diamond plan.");
      router.push('/pricing');
    }
  }, [userData, router]);

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
    if (sessionData?.conversationId && !localStream && conversationState === 'active') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          setLocalStream(stream);
          localStreamRef.current = stream;
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
  }, [sessionData?.conversationId, localStream, conversationState]);

  // Sync local video element with stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const toggleMic = async () => {
    if (anamRef.current && conversationState === 'active') {
      try {
        const newState = !isMicOn;
        // Anam SDK handles mic via browser media stream, but we can signal intent or use their API
        // For now, mirroring existing behavior if they support it
        // Note: Anam usually handles mic internally once streaming starts
        setIsMicOn(newState);
        // If Anam has a mute/unmute API, it would be used here.
      } catch (err: any) {
        console.error('[Anam] Failed to toggle mic:', err);
      }
    }
  };

  const endConversation = useCallback(async (source: string = 'unknown') => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    console.log(`[Anam] endConversation triggered. Source: ${source}`);
    setConversationState('ending');
    setIsVideoOn(false);

    try {
      if (anamRef.current) {
        console.log(`[Anam] Stopping streaming from endConversation (${source})`);
        try {
          anamRef.current.stopStreaming();
        } catch (e) {
          console.error('[Anam] Error during stopStreaming:', e);
        }
        anamRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);

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
            transcript: transcriptRef.current,
            source: source
          }),
        });
      }

      // Exit native browser fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.warn('[Fullscreen] Exit failed:', err);
        });
      }
    } catch (error) {
      console.error('Error ending interview:', error);
    } finally {
      if (sessionData?.interviewId) setLastInterviewId(sessionData.interviewId);
      setSessionData(null);
      setConversationState('ended');
      isEndingRef.current = false;
      setWarningLevel(null);
    }
  }, [sessionData]);

  const handleTimeWarning = useCallback((level: 'low' | 'critical') => {
    setWarningLevel(level);

    // Make Richard speak the warning at the 15-second mark (level 'low')
    if (level === 'low' && anamRef.current) {
      anamRef.current.talk("We have fifteen seconds remaining. This will conclude our session today. Thank you for your time and goodbye.");
    }

    fetch('/api/interviews/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interview_id: interviewIdRef.current,
        message: level === 'critical' ? '10 seconds remaining' : '30 seconds remaining',
        type: 'warning'
      }),
    }).catch(err => console.error('Failed to log time warning:', err));
  }, []);

  const handleTimeExpired = useCallback(() => {
    toast.info("Your interview time has ended. Wrapping up...");
    endConversation('Timer (Expired)');
  }, [endConversation]);

  // 1. Initialization useEffect
  useEffect(() => {
    if (conversationState === 'active' && sessionData?.anamSessionToken && !anamRef.current) {
      console.log('[Anam] Initializing new session');

      const client = createClient(sessionData.anamSessionToken);
      anamRef.current = client;

      console.log('[Anam] Available Events:', AnamEvent);

      // Add listener for all available event keys to see what's actually firing
      Object.keys(AnamEvent).forEach(eventKey => {
        const eventValue = (AnamEvent as any)[eventKey];
        client.addListener(eventValue, (...args: any[]) => {
          if (eventKey !== 'ANIMATION_DATA_RECEIVED') { // Avoid spamming these
            console.log(`[Anam Event Log] ${eventKey} (${eventValue}) fired`, args.length > 0 ? args[0] : '');
          }
        });
      });

      client.addListener(AnamEvent.SESSION_READY, () => {
        console.log('[Anam] Session Ready (Event)');
        setIsConnecting(false);
        setIsMicOn(true);

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

        // Start the conversation if it doesn't auto-start
        setTimeout(() => {
          if (anamRef.current && isMountedRef.current && conversationStateRef.current === 'active' && transcriptRef.current.length === 0) {
            console.log('[Anam] Sending initial trigger message to start conversation');
            try {
              (anamRef.current as any).talk("Hello, I am ready to begin the interview.");
            } catch (e) {
              console.warn('[Anam] talk() method failed or not available on client', e);
            }
          }
        }, 3000);
      });

      client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        console.log('[Anam] Video Play Started (Event) - Attempting to force audio');
        setIsAvatarVisible(true);

        // Ensure video is unmuted and playing
        if (anamVideoRef.current) {
          anamVideoRef.current.muted = false;
          anamVideoRef.current.volume = 1.0;
          anamVideoRef.current.play().catch(err => {
            console.warn('[Anam] Auto-play with audio blocked. User interaction may be required.', err);
          });
        }
      });

      // --- TRANSCRIPT COLLECTION ---
      const historyEvent = (AnamEvent as any).MESSAGE_HISTORY_UPDATED || 'MESSAGE_HISTORY_UPDATED';
      client.addListener(historyEvent, (history: any[]) => {
        console.log('[Anam] History Updated:', history);
        if (Array.isArray(history)) {
          const formatted = history.map(m => ({
            role: m.role === 'human' || m.role === 'user' ? 'user' : 'assistant',
            content: m.text || m.content || ''
          })).filter(m => m.content.trim() !== '');
          setTranscript(formatted);
        }
      });

      client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (message: any) => {
        console.log('[Anam] Message Stream Received:', message);
        if (message && message.content && message.endOfSpeech) {
          setTranscript(prev => {
            if (prev.some((m: any) => m.id === message.id)) return prev;
            if (prev.some(m => m.content === message.content)) return prev;
            return [...prev, {
              id: message.id,
              role: message.role === 'human' || message.role === 'user' ? 'user' : 'assistant',
              content: message.content
            }];
          });
        }
      });

      // --- AI TOOL CALLS ---
      client.addListener(AnamEvent.CLIENT_TOOL_EVENT_RECEIVED, (toolCall: any) => {
        console.log('[Anam] Tool Call Received (Raw):', toolCall);
        if (toolCall?.eventName === 'end_interview_session') {
          console.log('[Anam] AI requested to end session. Reason:', toolCall.eventData?.reason);
          setTimeout(() => {
            endConversation('AI Tool Trigger');
          }, 300);
        }
      });

      // --- DIAGNOSTICS ---
      const speechStartedEvent = (AnamEvent as any).SPEECH_STARTED || 'speechStarted';
      const speechStoppedEvent = (AnamEvent as any).SPEECH_STOPPED || 'speechStopped';

      client.addListener(speechStartedEvent, () => {
        console.log('[Anam] AI Speech Started');
        setIsAiSpeaking(true);
        isAiSpeakingRef.current = true;
      });

      client.addListener(speechStoppedEvent, () => {
        console.log('[Anam] AI Speech Stopped');
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      });

      client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        console.log('[Anam] Connection Closed (Event)');
        if (isMountedRef.current && conversationStateRef.current === 'active') {
          endConversation('Connection Closed');
        }
      });

      return () => {
        if (anamRef.current && (isEndingRef.current || !isMountedRef.current)) {
          console.log('[Anam] Cleanup: Stopping streaming');
          try {
            anamRef.current.stopStreaming();
          } catch (e) { }
          anamRef.current = null;
        }
      };
    }
  }, [conversationState, sessionData?.anamSessionToken, endConversation]);

  // 2. Start streaming when video element is ready
  useEffect(() => {
    if (anamRef.current && anamVideoRef.current && conversationState === 'active' && !isConnecting) {
      console.log('[Anam] Video element ready, starting stream');
      try {
        anamRef.current.streamToVideoElement('anam-video-element');
      } catch (err) {
        console.error('[Anam] streamToVideoElement failed:', err);
      }
    }
  }, [conversationState, isConnecting]);

  // 3. Initialize user's camera when interview becomes active
  useEffect(() => {
    if (conversationState === 'active' && !localStreamRef.current) {
      console.log('[Camera] Requesting user camera access');
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          console.log('[Camera] Camera access granted');
          localStreamRef.current = stream;
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('[Camera] Failed to get camera access:', err);
          // Don't show error toast - camera is optional for the interview
        });
    }

    // Cleanup camera when conversation ends
    return () => {
      if (conversationState !== 'active' && localStreamRef.current) {
        console.log('[Camera] Cleaning up camera stream');
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };
  }, [conversationState]);

  const startAiConversation = async (interviewId: string) => {
    setIsConnecting(true);
    setConversationState('connecting');
    setConnectionStartTime(Date.now());
    setHasTimedOut(false);
    setTranscript([]);

    try {
      const response = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole,
          description: userDescription,
          useResume: hasResume ? useResume : false,
          interviewId: interviewId
        }),
      });

      const startData = await response.json();
      if (!response.ok) {
        toast.error(startData.error || 'Failed to start interview');
        setConversationState('idle');
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.warn('[Fullscreen] Exit failed:', err);
          });
        }
        return;
      }

      setSessionData({
        conversationId: startData.conversation_id,
        anamSessionToken: startData.anam_session_token,
        interviewId: startData.interview_id,
        remainingSeconds: startData.remaining_seconds,
        resumeContent: startData.resume_content
      });
      interviewIdRef.current = startData.interview_id;
      setConversationState('active');
    } catch (err) {
      toast.error('Failed to start interview');
      setConversationState('idle');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.warn('[Fullscreen] Exit failed:', err);
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const createConversation = async (role: string, description?: string) => {
    if (isConnecting || conversationState === 'connecting' || conversationState === 'active') return;

    // Handle session creation if it doesn't exist yet
    if (!currentInterviewId) {
      setIsPolling(true);
      try {
        const session = await createSessionMutation.mutateAsync({
          role: role,
          description: description || '',
          type: (urlType as any) || 'screening',
          questionCount: parseInt(urlCount || '10'),
          resumeId: urlResumeId || undefined,
          mode: 'AVATAR'
        });
        setCurrentInterviewId(session.interviewId);
        interviewIdRef.current = session.interviewId;
      } catch (err) {
        toast.error('Failed to initialize session');
        setIsPolling(false);
      }
      return;
    }

    // If ID exists but no questions, start polling
    if (questions.length === 0) {
      setIsPolling(true);
      return;
    }

    await startAiConversation(currentInterviewId);
  };

  const handleRoleSubmit = () => {
    if (!userRole || !userDescription) {
      toast.error('Position and description are required');
      return;
    }

    setShowRoleDialog(false);

    // Request native browser fullscreen
    if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('[Fullscreen] Request blocked or failed:', err);
      });
    }

    createConversation(userRole, userDescription);
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
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col relative bg-transparent transition-colors duration-500 font-sans ${warningLevel === 'critical' ? 'ring-inset ring-8 ring-red-600 animate-pulse' : ''
        } ${warningLevel === 'low' ? 'ring-inset ring-4 ring-yellow-500' : ''}`}
    >



      <div className="relative flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Tailoring Overlay - Shown while creating session or generating questions */}
        {isPolling && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-bounce" />
              </div>
            </div>

            <div className="text-center space-y-4 max-w-sm">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Crafting Your Interview</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Analyzing requirements to optimize your AI Interviewer...
              </p>

              <div className="flex items-center justify-center gap-1.5 pt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                    className="w-2 h-2 rounded-full bg-purple-500"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {(conversationState === 'active' || conversationState === 'connecting') && sessionData ? (
          /* ACTIVE INTERVIEW UI - Integrated into Studio */
          <div className="flex-1 w-full relative flex flex-col">
            <div
              id="anam-container"
              className="flex-1 w-full bg-slate-950 relative group"
            >
              <video
                ref={anamVideoRef}
                id="anam-video-element"
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />

              {/* Internal Studio Label */}
              <div className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-white tracking-widest">LIVE STUDIO</span>
              </div>
            </div>

            {/* PIP (User Video) */}
            <div className="absolute top-20 right-6 w-44 h-56 sm:w-52 sm:h-72 rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl z-40 bg-gray-950">
              {localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror-mode" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 text-gray-500">
                  <User className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-[11px] uppercase tracking-wider font-semibold opacity-40">No Camera</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] text-white font-semibold">You</div>
            </div>

            {/* Header Overlays */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
              <div className="bg-gray-900/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 shadow-lg pointer-events-auto">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center"><User className="h-5 w-5 text-blue-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{userRole || "Practice Session"}</p>
                    <p className="text-[11px] text-gray-300 font-medium">Live AI Interview</p>
                  </div>
                </div>
              </div>

              {sessionData?.interviewId && (
                <div className="bg-gray-900/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 shadow-lg pointer-events-auto">
                  {isAvatarVisible ? (
                    <InterviewTimer interviewId={sessionData.interviewId} initialSeconds={sessionData.remainingSeconds} onTimeExpired={handleTimeExpired} onWarning={handleTimeWarning} />
                  ) : (
                    <div className="flex items-center space-x-2 text-white/70"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs font-semibold">Initializing...</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-5 w-full max-w-2xl px-6">
              <div className="flex items-center gap-1.5 h-10">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isAiSpeaking ? { height: [6, 24, 10, 28, 8] } : { height: 6 }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                    className="w-1.5 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full shadow-lg"
                  />
                ))}
              </div>

              <div className="bg-black/50 backdrop-blur-2xl border border-white/20 rounded-full px-10 py-5 flex items-center justify-between gap-14 shadow-2xl">
                <div className="flex items-center gap-7">
                  <button
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20 hover:scale-105' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    onClick={toggleMic}
                  >
                    {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                  </button>
                  <div className="h-8 w-[1px] bg-white/20" />
                  <button
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all"
                    onClick={() => endConversation('User Hangup')}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex items-center gap-7">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all shadow-lg ${showTranscript ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'}`}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">History</span>
                  </button>
                  <div className="h-8 w-[1px] bg-white/20" />
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-lg shadow-purple-500/50" />
                    <span className="text-[11px] uppercase font-black tracking-widest text-white/50">Studio</span>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  className="absolute top-0 right-0 bottom-0 w-80 z-[60] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 flex flex-col pt-24 pb-32"
                >
                  <div className="px-6 mb-6 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">History</h3>
                    <button onClick={() => setShowTranscript(false)}><Minimize2 className="h-4 w-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 space-y-6">
                    {transcript.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No messages yet...</div>
                    ) : (
                      transcript.map((msg, i) => (
                        <div key={i} className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-500' : 'text-purple-500'}`}>
                            {msg.role === 'user' ? 'You' : 'Rich'}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {msg.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-24 left-8 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold text-white tracking-widest">LIVE STUDIO</span>
            </div>
          </div>
        ) : conversationState === 'ended' || conversationState === 'ending' ? (
          /* ENDED UI */
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg w-full p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <Clock className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Interview Completed!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 text-base">Your performance is being analyzed.</p>
              {analysisError && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{analysisError}</AlertDescription></Alert>}
              <div className="flex flex-col gap-3">
                <Button onClick={handleGenerateReport} disabled={isAnalyzing} className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base shadow-lg">
                  {isAnalyzing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Analyzing...</> : 'Generate Full Analysis'}
                </Button>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} disabled={isAnalyzing} className="w-full h-12 rounded-2xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold">
                  Return to Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* IDLE / READY TO START UI */
          <div className="flex-1 flex items-center justify-center p-6 relative">
            <AnimatePresence mode="wait">
              {isConnecting ? (
                /* Connecting State Overlay inside the Ready/Idle view */
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                    </div>
                  </div>
                  <p className="text-purple-600 text-sm font-bold uppercase tracking-[0.2em]">Establishing Link...</p>
                </motion.div>
              ) : (urlInterviewId || urlRole) ? (
                /* Ready to Start / Entry Page - Just show preview message */
                <motion.div
                  key="entry"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center text-center space-y-8 max-w-2xl px-6"
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shadow-inner">
                      <Video className="h-12 w-12 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
                    </div>
                    {/* Subtle pulse ring */}
                    <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-pulse scale-150" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-5xl font-bold text-[#4F46E5] dark:text-purple-400 tracking-tight">
                      AI Avatar Interview
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                      Professional AI Assessment Environment
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Welcome Screen (No Params) */
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center max-w-lg"
                >
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center mb-8 border border-purple-500/20 shadow-inner">
                    <Video className="h-12 w-12 text-purple-600" />
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                    Niena <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Studio</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                    Experience the future of interview preparation in our immersive, AI-powered assessment environment.
                  </p>
                  <Button
                    onClick={() => setShowRoleDialog(true)}
                    className="h-14 px-10 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-xl shadow-purple-500/25 transition-all"
                  >
                    Configure Your Session
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Preview Dialog - Shows interview details before starting */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent
          className="w-[92vw] sm:max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-0 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden fixed top-24 left-[50%] -translate-x-1/2 translate-y-0 bottom-auto sm:top-24"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="relative p-6 sm:p-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
            <DialogHeader className="mb-8 items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/20 shrink-0">
                <Video className="h-8 w-8 text-purple-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">Interview Preview</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm mt-1 font-medium">Review your details before entering the studio</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Target Position</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white truncate">{userRole}</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Briefing</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                  {userDescription}
                </p>
              </div>

              <div className="flex items-center justify-between p-5 px-6 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Use Active Resume</span>
                </div>
                <Switch checked={useResume} onCheckedChange={setUseResume} disabled={!hasResume} className="data-[state=checked]:bg-purple-600" />
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <Button
                  onClick={handleRoleSubmit}
                  disabled={isConnecting || isPolling}
                  className="w-full h-14 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
                >
                  {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enter Studio"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/interview')}
                  className="w-full h-10 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
        #anam-container video { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
        .mirror-mode { transform: scaleX(-1); }
      `}} />

    </div>
  );
};

export default VideoInterview;
