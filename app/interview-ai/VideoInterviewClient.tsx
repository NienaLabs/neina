'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { motion, AnimatePresence } from 'framer-motion';

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


  // Anam Initialization
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
        toast.success("AI Interviewer is ready!");
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
      // Listen for the full conversation history to keep our state in sync
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

      // Optionally listen for individual messages for immediate feedback
      client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (message: any) => {
        console.log('[Anam] Message Stream Received:', message);
        if (message && message.content && message.endOfSpeech) {
          setTranscript(prev => {
            // Check if this specific message ID is already in the transcript
            if (prev.some((m: any) => m.id === message.id)) return prev;

            // Also deduplicate by content if needed
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
      // Listen for tool calls defined in the Anam Dashboard
      client.addListener(AnamEvent.CLIENT_TOOL_EVENT_RECEIVED, (toolCall: any) => {
        console.log('[Anam] Tool Call Received (Raw):', toolCall);

        // Map the eventName to what we expect
        if (toolCall?.eventName === 'end_interview_session') {
          console.log('[Anam] AI requested to end session. Reason:', toolCall.eventData?.reason);

          // Note: respondToToolCall does not exist on this SDK version. 
          // The AI ending the call usually triggers a immediate disconnection logic.

          // Delay slightly to ensure any final processing is done
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

      // Start streaming - this initiates the connection
      client.streamToVideoElement('anam-video-element');

      client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        console.log('[Anam] Connection Closed (Event)');
        if (conversationStateRef.current === 'active') {
          endConversation('Connection Closed (Event)');
        }
      });

      // Use string literal for error to avoid TS enum mismatch if it exists elsewhere
      client.addListener('error' as any, (error: any) => {
        console.error('[Anam] SDK Error Listener:', error);
        toast.error('Anima AI encountered an error. Please try restarting.');
        setIsConnecting(false);
        // Don't automatically end here, let's see why it's failing
      });

      return () => {
        // Only stop streaming if we are actually ending or the component is truly unmounting.
        // We avoid calling endConversation and stopping if it's just a routine re-render.
        if (anamRef.current && (isEndingRef.current || !isMountedRef.current)) {
          console.log('[Anam] Cleanup: Stopping streaming');
          try {
            anamRef.current.stopStreaming();
          } catch (e) { }
          anamRef.current = null;
        }
      };
    }
  }, [conversationState, sessionData?.conversationId, sessionData?.anamSessionToken]);

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
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.warn('[Fullscreen] Exit failed:', err);
          });
        }
        router.push('/interview-ai');
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
      router.push('/interview-ai');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRoleSubmit = async () => {
    if (userRole.trim()) {
      setShowRoleDialog(false);

      // Request native browser fullscreen for the "YouTube-like" experience
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => {
          console.warn('[Fullscreen] Request blocked or failed:', err);
        });
      }

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
    <div
      ref={containerRef}
      className={`transition-all duration-500 overflow-hidden flex flex-col relative ${sessionData?.conversationId
        ? 'fixed inset-0 z-[100] bg-transparent'
        : 'h-full bg-transparent flex-1'
        } ${warningLevel === 'critical' ? 'ring-inset ring-8 ring-red-600 animate-pulse' : ''} ${warningLevel === 'low' ? 'ring-inset ring-4 ring-yellow-500' : ''}`}>
      {/* Configuration Header - Only shown when NOT in an active call */}
      {!sessionData?.conversationId && (
        <div className="bg-black/10 backdrop-blur-md border-b border-white/5 p-4 shrink-0">
          <div className="max-w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Video Interview</h1>
                <FeatureGuide title="Anam AI Interview" description="Practice with an Anam AI avatar." />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connect for a face-to-face conversation</p>
            </div>
            <Button variant="default" size="sm" onClick={() => setShowRoleDialog(true)} disabled={isConnecting}>
              {isConnecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</> : <><Video className="h-4 w-4 mr-2" />Start Interview</>}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`relative flex-1 bg-transparent overflow-hidden ${sessionData?.conversationId ? 'm-0 h-full w-full' : 'h-full w-full'}`}>
        {sessionData?.conversationId ? (
          <div className="w-full h-full relative">
            <div id="anam-container" className="w-full h-full bg-black min-h-[400px] flex items-center justify-center">
              <video ref={anamVideoRef} id="anam-video-element" className="w-full h-full object-cover" autoPlay playsInline />
            </div>

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

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-6 w-full max-w-2xl px-6">
              {/* Audio Reactive Visualizer (AI) */}
              <div className="flex items-center gap-1 h-8">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isAiSpeaking ? { height: [4, 20, 8, 24, 6] } : { height: 4 }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                    className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                  />
                ))}
              </div>

              {/* Studio Control Bar */}
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 flex items-center justify-between gap-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500'}`}
                    onClick={toggleMic}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </motion.button>

                  <div className="h-6 w-[1px] bg-white/10" />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/20"
                    onClick={() => endConversation('User Hangup')}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="flex items-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTranscript(!showTranscript)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${showTranscript ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                  >
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">History</span>
                  </motion.button>
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Studio Master</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sliding Transcript Drawer */}
            <AnimatePresence mode="wait">
              {showTranscript && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute top-0 right-0 bottom-0 w-80 z-[60] bg-white/80 backdrop-blur-3xl border-l border-purple-500/10 flex flex-col pt-24 pb-32 shadow-[-20px_0_50px_rgba(168,85,247,0.05)]"
                >
                  <div className="px-6 mb-6 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Session Logs</h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowTranscript(false)}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 space-y-6 scrollbar-hide">
                    {transcript.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-300 italic text-xs text-center px-4 font-medium">Waiting for conversation...</div>
                    ) : (
                      transcript.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                        >
                          <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${msg.role === 'user' ? 'text-blue-500' : 'text-purple-500'}`}>
                            {msg.role === 'user' ? 'Candidate' : 'Richard'}
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                            {msg.content}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* REC Status Tag */}
            <div className="absolute top-24 left-8 z-50 flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-500/10 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-700">REC</span>
              <div className="h-3 w-[1px] bg-slate-200 mx-1" />
              <span className="text-[10px] font-mono text-slate-400">STUDIO_STREAM</span>
            </div>
          </div>
        ) : (conversationState === 'ended' || conversationState === 'ending') ? (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent">
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
          <div className="absolute inset-0 flex items-center justify-center bg-transparent">
            <div className="text-center w-full max-w-xl mx-auto">
              {isConnecting ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                    </div>
                  </div>
                  <p className="text-purple-600/60 text-sm font-black uppercase tracking-[0.3em] font-mono">Establishing Link...</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  {/* Simple Icon */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center mb-8 border border-purple-500/20">
                    <Video className="h-12 w-12 text-purple-600" />
                  </div>

                  <h2 className="text-4xl font-bold text-slate-900 mb-3">
                    Niena <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Studio</span>
                  </h2>
                  <p className="text-slate-600 text-sm mb-10">Professional AI Assessment Environment</p>

                  <Button
                    onClick={() => setShowRoleDialog(true)}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      Start Interview
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-2xl border border-purple-500/10 p-0 overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(168,85,247,0.12)]">
          <div className="relative p-6">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <DialogHeader className="mb-5 items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center mb-3 border border-purple-500/10">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 mb-1">Studio Setup</DialogTitle>
              <DialogDescription className="text-slate-600 text-xs">Configure your interview session</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-semibold text-slate-700">Position</Label>
                <Input
                  id="role"
                  value={userRole}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserRole(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 rounded-xl text-slate-900 text-sm px-3.5 transition-all"
                  placeholder="e.g. Frontend Engineer"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700">Context <span className="text-slate-400 font-normal">(Optional)</span></Label>
                <textarea
                  id="description"
                  value={userDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserDescription(e.target.value)}
                  className="w-full min-h-[90px] bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 rounded-xl p-3.5 text-sm text-slate-900 transition-all outline-none resize-none"
                  placeholder="Skills to test or job details..."
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <Label htmlFor="use-resume" className="text-sm font-semibold text-slate-800">Use Resume</Label>
                </div>
                <Switch id="use-resume" checked={useResume} onCheckedChange={setUseResume} disabled={!hasResume} className="data-[state=checked]:bg-purple-600" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowRoleDialog(false)}
                  className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRoleSubmit}
                  disabled={!userRole.trim() || isConnecting}
                  className="flex-[1.8] h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all text-sm"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Start Session
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  )}
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
