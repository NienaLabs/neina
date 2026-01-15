'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Mic, 
  User, 
  Sparkles, 
  Target, 
  Briefcase, 
  FileText,
  Code,
  Clock,
  Timer as TimerIcon,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Orb } from '@/components/interview/Orb';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FeatureGuide } from '@/components/FeatureGuide';
import { Progress } from '@/components/ui/progress';

// Dynamic import for Agora Provider
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } = await import('agora-rtc-react');
    return {
      default: ({ children }: { children: React.ReactNode }) => {
        const client = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))[0];
        return <AgoraRTCProvider client={client}>{children}</AgoraRTCProvider>;
      },
    };
  },
  { ssr: false }
);

const ConversationComponent = dynamic(() => import('@/components/interview/ConversationComponent'), {
  ssr: false,
});

type InterviewMode = 'VOICE' | 'AVATAR';
type Step = 'config' | 'briefing' | 'active' | 'summary';

export default function InterviewPage() {
  const params = useParams();
  const type = params.type as string;

  const [step, setStep] = useState<Step>('config');
  
  // Config State
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeId, setResumeId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState([10]);
  const [mode, setMode] = useState<InterviewMode>('VOICE');
  const [technicalTopic, setTechnicalTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Agora State
  const [agoraLocalUserInfo, setAgoraLocalUserInfo] = useState<AgoraLocalUserInfo | null>(null);

  // Session State
  const [createdInterviewId, setCreatedInterviewId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [transcript, setTranscript] = useState<{ role: string; content: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);

  // Queries
  const { data: resumes, isLoading: isLoadingResumes } = trpc.resume.getPrimaryResumes.useQuery();

  // Mutations
  const createSessionMutation = trpc.interview.createSession.useMutation();
  const endSessionMutation = trpc.interview.endSession.useMutation();

  // Mock User Plan Check (TODO: Replace with actual subscription check)
  const isDiamondPlan = false; 

  const getInterviewTitle = (t: string) => {
    switch (t) {
      case 'screening': return 'Screening Interview';
      case 'behavioral': return 'Behavioral Interview';
      case 'technical': return 'Technical Interview';
      case 'general': return 'General Interview';
      case 'promotion': return 'Promotion & Scholarship';
      default: return 'Interview';
    }
  };

  const getInterviewDescription = (t: string) => {
    switch (t) {
      case 'screening': return 'Short interviews to align expectations and qualifications.';
      case 'behavioral': return 'Scenario-based questions to measure past experiences.';
      case 'technical': return 'Assess technical skills and deep knowledge.';
      case 'general': return 'A comprehensive mix of all interview types.';
      default: return 'Practice your interview skills.';
    }
  };

  const handleConfigSubmit = () => {
    if (!role || !jobDescription) {
      toast.error("Please enter both a role and job description.");
      return;
    }
    setStep('briefing');
  };

  // Polling for interview status
  const { data: interviewData } = trpc.interview.getInterview.useQuery(
    { interviewId: createdInterviewId! },
    { 
        enabled: !!createdInterviewId && isPolling,
        refetchInterval: 1000, 
    }
  );

  useEffect(() => {
      if (interviewData && interviewData.questions && (interviewData.questions as any[]).length > 0 && isPolling) {
          setIsPolling(false); 
          initiateAgoraSession(interviewData.id);
      }
  }, [interviewData, isPolling]);


  const handleStartSession = async () => {
    setIsLoading(true);
    try {
        const finalDescription = technicalTopic 
          ? `${jobDescription}\n\nFocus Topic/Skill: ${technicalTopic}`
          : jobDescription;

        const result = await createSessionMutation.mutateAsync({
            role,
            description: finalDescription,
            type: type as any,
            questionCount: questionCount[0],
            resumeId: resumeId !== 'none' ? resumeId : undefined,
            mode: mode
        });
        
        setCreatedInterviewId(result.interviewId);
        setIsPolling(true); 
        toast.info("Generating interview questions...");
    } catch (error) {
        console.error(error);
        toast.error("Failed to create session");
        setIsLoading(false);
    }
  };

  const initiateAgoraSession = async (intId: string) => {
      try {
           toast.success("Questions generated! Connecting...");
           
           const tokenResponse = await fetch('/api/generate-agora-token');
           if (!tokenResponse.ok) throw new Error("Failed to generate token");
           const tokenData = await tokenResponse.json();

           const inviteResponse = await fetch('/api/invite-agent', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   requester_id: tokenData.uid,
                   channel_name: tokenData.channel,
                   interviewId: intId
               })
           });

           if (!inviteResponse.ok) throw new Error("Failed to invite agent");
           
           setAgoraLocalUserInfo({
               uid: tokenData.uid,
               token: tokenData.token,
               channel: tokenData.channel,
               agentId: undefined 
           });
           
           // Start Timer
           setStartTime(new Date());
           setElapsedSeconds(0);
           setTranscript([]); // Reset
           setStep('active');
           
           if(timerRef.current) clearInterval(timerRef.current);
           timerRef.current = setInterval(() => {
               setElapsedSeconds(prev => prev + 1);
           }, 1000);

      } catch (error) {
           console.error("Connection failed", error);
           toast.error("Failed to connect to interview session");
           setIsPolling(false); 
      } finally {
           setIsLoading(false);
      }
  };

  const handleTokenWillExpire = async (uid: string) => {
     const response = await fetch(
        `/api/generate-agora-token?channel=${agoraLocalUserInfo?.channel}&uid=${uid}`
      );
      const data = await response.json();
      return data.token;
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscriptUpdate = (text: string, uid: string) => {
      // Simple heuristic: if uid matches agent (usually not us), assume agent.
      // But we receive our own too? 
      // For now, let's just push it.
      // Ideally check uid vs local uid.
      const isAgent = uid !== agoraLocalUserInfo?.uid.toString();
      setTranscript(prev => [...prev, { role: isAgent ? 'interviewer' : 'candidate', content: text }]);
  };

  const handleEndSession = async () => {
      if(timerRef.current) clearInterval(timerRef.current);
      setIsAnalyzing(true);
      setStep('summary'); // Show loading state in summary step

      try {
          const result = await endSessionMutation.mutateAsync({
              interviewId: createdInterviewId!,
              durationSeconds: elapsedSeconds,
              transcript: transcript
          });
          
          if(result.feedback) {
             setScoreResult(result.feedback);
          }
      } catch (error) {
          console.error("Failed to end session:", error);
          toast.error("Failed to generate score");
      } finally {
          setIsAnalyzing(false);
      }
  };

  // Cleanup timer
  useEffect(() => {
      return () => {
          if(timerRef.current) clearInterval(timerRef.current);
      }
  }, []);

  if (step === 'active' && agoraLocalUserInfo) {
      return (
        <div className="h-screen w-full bg-slate-950 relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10">
                 <Button variant="ghost" className="text-white hover:bg-white/10 gap-2" onClick={handleEndSession}>
                    <ArrowLeft className="w-4 h-4" /> End Call
                 </Button>
            </div>
            
            {/* Timer Display */}
            <div className="absolute top-4 right-4 z-10">
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-md rounded-full border border-white/10 text-white font-mono shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <TimerIcon className="w-4 h-4 text-slate-400" />
                    <span>{formatTime(elapsedSeconds)}</span>
                 </div>
            </div>

            <div className="flex-1 px-4 relative">
                {/* Background Orb or Avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {mode === 'VOICE' ? (
                        <div className="w-[85vw] aspect-square max-w-[400px] md:w-full md:h-full md:max-w-4xl md:max-h-[80vh] md:aspect-auto">
                             <Orb 
                                agentState="listening" 
                                volumeMode="auto" 
                                colors={["#60a5fa", "#3b82f6"]}
                             />
                        </div>
                    ) : (
                         <div className="w-64 h-64 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-[0_0_100px_rgba(168,85,247,0.5)] flex items-center justify-center animate-pulse">
                             <span className="text-4xl text-white font-bold">AI</span>
                         </div>
                    )}
                </div>
                
                {/* Conversation Component Overlay */}
                 <div className="absolute inset-x-0 bottom-0 h-32 z-20">
                    <AgoraProvider>
                        <ConversationComponent 
                            agoraLocalUserInfo={agoraLocalUserInfo}
                            onTokenWillExpire={handleTokenWillExpire}
                            onEndConversation={handleEndSession} // Handle end here
                            onTranscriptUpdate={handleTranscriptUpdate}
                        />
                    </AgoraProvider>
                 </div>
            </div>
        </div>
      );
  }

  if (step === 'summary') {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
              <Card className="w-full max-w-3xl border-slate-200 dark:border-slate-800 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                  <CardHeader className="text-center pb-8 border-b border-slate-100 dark:border-slate-800">
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Interview Summary
                      </CardTitle>
                      <CardDescription className="text-lg">
                          Here is how you performed in your {type} interview.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                       {isAnalyzing ? (
                           <div className="flex flex-col items-center justify-center py-12 space-y-4">
                               <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                               <p className="text-slate-500 animate-pulse">Analyzing transcript & generating score...</p>
                           </div>
                       ) : scoreResult ? (
                           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                               {/* Score Display */}
                               <div className="flex flex-col items-center justify-center space-y-4">
                                   <div className="relative w-40 h-40 flex items-center justify-center">
                                       <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                fill="transparent"
                                                className="text-slate-200 dark:text-slate-800"
                                            />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={440}
                                                strokeDashoffset={440 - (440 * (scoreResult.score / 5))} // 1-5 scale
                                                className={cn(
                                                    "transition-all duration-1000 ease-out",
                                                    scoreResult.score >= 4 ? "text-green-500" :
                                                    scoreResult.score >= 3 ? "text-blue-500" :
                                                    "text-orange-500"
                                                )}
                                            />
                                       </svg>
                                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-bold">{scoreResult.score}</span>
                                            <span className="text-sm text-slate-500 uppercase tracking-widest">/ 5</span>
                                       </div>
                                   </div>
                                   
                                   <div className="text-center space-y-1">
                                       <h3 className="text-xl font-bold">
                                           {scoreResult.score >= 5 ? "Exceptional" :
                                            scoreResult.score >= 4 ? "Exceeds Expectations" :
                                            scoreResult.score >= 3 ? "Meets Expectations" :
                                            scoreResult.score >= 2 ? "Needs Improvement" : "Unsatisfactory"}
                                       </h3>
                                       <p className="text-slate-500 max-w-sm mx-auto text-sm">
                                            {scoreResult.score === 1 && "Answer provided was not efficient."}
                                            {scoreResult.score === 2 && "Part of answer provided but something left out."}
                                            {scoreResult.score === 3 && "Full answer provided without missing details."}
                                            {scoreResult.score === 4 && "Provided answer and alternative/simpler solutions."}
                                            {scoreResult.score === 5 && "Provided detailed answer, alternatives, and deep understanding."}
                                       </p>
                                   </div>
                               </div>

                               {/* Detailed Feedback */}
                               <div className="space-y-4">
                                   <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                                       <h4 className="font-semibold mb-2 flex items-center gap-2">
                                           <Sparkles className="w-4 h-4 text-purple-500" />
                                           AI Feedback
                                       </h4>
                                       <div className="prose dark:prose-invert text-sm max-w-none">
                                           {scoreResult.feedback}
                                       </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="p-5 rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10">
                                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Strengths
                                            </h4>
                                            <ul className="space-y-1">
                                                {scoreResult.strengths?.map((s: string, i: number) => (
                                                    <li key={i} className="text-sm text-green-800 dark:text-green-300">• {s}</li>
                                                ))}
                                            </ul>
                                       </div>
                                       <div className="p-5 rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-900/10">
                                            <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                                                <Target className="w-4 h-4" /> Areas for Improvement
                                            </h4>
                                            <ul className="space-y-1">
                                                {scoreResult.weaknesses?.map((w: string, i: number) => (
                                                    <li key={i} className="text-sm text-orange-800 dark:text-orange-300">• {w}</li>
                                                ))}
                                            </ul>
                                       </div>
                                   </div>
                               </div>

                               <div className="flex justify-center pt-4">
                                   <Button size="lg" onClick={() => setStep('config')}>Start New Interview</Button>
                               </div>
                           </div>
                       ) : (
                           <div className="text-center py-8">
                               <p className="text-red-500">Failed to load results. Please try again.</p>
                               <Button variant="outline" onClick={() => setStep('config')} className="mt-4">Back to Home</Button>
                           </div>
                       )}
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (step === 'briefing') {
      const getHeroImage = (t: string) => {
        switch (t) {
          case 'technical': return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop';
          case 'behavioral': return 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1000&auto=format&fit=crop';
          default: return 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop';
        }
      };

      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
             {/* Ambient Background */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 dark:opacity-10 blur-sm pointer-events-none" />
             
             <Card className="w-full max-w-xl border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10">
                 {/* Loading Overlay */}
                 {(isLoading || isPolling) && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin [animation-duration:3s] opacity-50" />
                            <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-blue-500 animate-pulse" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
                                AI is Crafting your Interview
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Analyzing role requirements & generating tailored questions...
                            </p>
                        </div>
                    </div>
                 )}

                 <div className="relative h-48 w-[calc(100%+2px)] -mx-px -mt-px group overflow-hidden rounded-t-xl">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${getHeroImage(type)}')` }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-slate-900 dark:via-slate-900/60" />
                 </div>

                 <CardContent className="px-8 pb-8 pt-12 space-y-8">
                     <div className="text-center space-y-2">
                         <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                             Ready for your Interview?
                         </h1>
                         <p className="text-lg text-muted-foreground">
                             You are about to start a <span className="font-semibold text-foreground">{getInterviewTitle(type)}</span> for the role of <span className="font-semibold text-foreground">{role}</span>.
                         </p>
                     </div>

                     <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-6 space-y-4 border border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  <Target className="w-4 h-4" />
                                  Session Details
                              </h3>
                          </div>
                          
                          <ul className="space-y-4 text-sm font-medium">
                              <li className="flex items-center justify-between group">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" /> Duration
                                  </span>
                                  <span className="text-foreground">~{(questionCount[0] * 1.5).toFixed(0)} minutes</span>
                              </li>
                              <li className="flex items-center justify-between group">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500" /> Questions
                                  </span>
                                  <span className="text-foreground">{questionCount[0]} tailored questions</span>
                              </li>
                              {technicalTopic && (
                                <li className="flex items-center justify-between group">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <Code className="w-4 h-4 text-orange-500" /> Focus
                                  </span>
                                  <span className="text-foreground text-right">{technicalTopic}</span>
                                </li>
                              )}
                          </ul>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-3 pt-2">
                         <Button variant="outline" className="flex-1 h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-base" onClick={() => setStep('config')}>
                             Back to Settings
                         </Button>
                         <Button className="flex-[2] h-12 text-lg shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 transition-transform active:scale-[0.98]" onClick={handleStartSession} disabled={isLoading}>
                             {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                                    Starting...
                                </span>
                             ) : "Start Interview Now"}
                         </Button>
                     </div>
                 </CardContent>
             </Card>
          </div>
      );
  }

  // Config Step (Immersive Layout)
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row relative lg:overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Left Column: Visual & Info */}
      <div className="lg:w-5/12 p-8 lg:p-12 flex flex-col relative z-10 bg-white/40 dark:bg-black/20 backdrop-blur-sm lg:border-r border-white/20">
        <div className="mb-8">
            <Link href="/interview" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Back
            </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
                <Badge variant="outline" className="w-fit py-1.5 px-4 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                    {getInterviewTitle(type)} Mode
                </Badge>
                <h1 className="text-5xl lg:text-6xl tracking-tight text-slate-900 font-mono dark:text-white">
                    Ace your <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                        {type} interviews
                    </span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                    {getInterviewDescription(type)}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="font-semibold">Real-time Feedback</div>
                    <div className="text-xs text-muted-foreground mt-1">Instant analysis of your answers</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-3">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="font-semibold">AI Powered</div>
                    <div className="text-xs text-muted-foreground mt-1">Adapts to your responses </div>
                </div>
            </div>
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 dark:border-slate-800/50">
               {/* Placeholder for dynamic role image, falling back to specific type images */}
               <div className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
                 type === 'technical' ? "bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000')]" :
                 type === 'behavioral' ? "bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1000')]" :
                 "bg-[url('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000')]"
               }`} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                      <p className="font-medium text-lg">AI Interview Coach</p>
                      <p className="text-white/80 text-sm">Practice in a safe, realistic environment.</p>
                  </div>
               </div>
            </div>
        </div>
      </div>

      {/* Right Column: Configuration Form */}
      <div className="lg:w-7/12 flex flex-col lg:overflow-y-auto relative z-10">
         <div className="flex-1 p-6 lg:p-12 max-w-2xl mx-auto w-full flex flex-col justify-center">
            
            <div className="space-y-8">
                <div>
                   <h2 className="text-2xl font-semibold mb-2">Configuration</h2>
                   <p className="text-muted-foreground">Customize your session to match your target role.</p>
                </div>

                <div className="space-y-6">
                    {/* Role Input */}
                    <div className="space-y-2">
                        <Label htmlFor="role" className="flex items-center gap-2">
                           <Briefcase className="w-4 h-4 text-blue-500" />
                           Target Role
                           <FeatureGuide description="Enter the standard job title you are applying for. The AI will assume this persona." />
                        </Label>
                        <Input
                            id="role"
                            placeholder="e.g. Senior Product Manager"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="h-12 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                        />
                    </div>

                    {/* Technical Topic Input - Conditional */}
                    {type === 'technical' && (
                       <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                           <Label htmlFor="topic" className="flex items-center gap-2">
                              <Code className="w-4 h-4 text-orange-500" />
                              Specific Topic / Skill (Optional)
                              <FeatureGuide description="Narrow down the technical questions to a specific domain or technology, e.g. 'React Hooks' or 'System Design'." />
                           </Label>
                           <Input
                               id="topic"
                               placeholder="e.g. Data Structures, React Patterns, System Design..."
                               value={technicalTopic}
                               onChange={(e) => setTechnicalTopic(e.target.value)}
                               className="h-12 border-orange-200 dark:border-orange-900/50 focus-visible:ring-orange-500"
                           />
                       </div>
                    )}

                    {/* Job Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="flex items-center gap-2">
                           <FileText className="w-4 h-4 text-purple-500" />
                           Job Description
                           <FeatureGuide description="Paste the full job description. The AI will extract key requirements to challenge you." />
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Paste the job description here..."
                            className="min-h-[150px] max-h-[300px] overflow-y-auto resize-none border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>

                    {/* Resume Input */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            Resume Context (Optional)
                            <FeatureGuide description="Select a resume to allow the AI to ask questions about your past experience." />
                        </Label>
                        <Select value={resumeId} onValueChange={setResumeId}>
                            <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a resume for context" />
                            </SelectTrigger>
                            <SelectContent>
                            {isLoadingResumes ? (
                                <SelectItem value="loading" disabled>Loading resumes...</SelectItem>
                            ) : resumes && resumes.length > 0 ? (
                                resumes.map((resume) => (
                                <SelectItem key={resume.id} value={resume.id}>
                                    {resume.name}
                                </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>No resumes found</SelectItem>
                            )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Question Count Input */}
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="questions" className="flex items-center gap-2">
                                Question Intensity
                                <FeatureGuide description="Choose between 3 to 10 questions for your session." />
                            </Label>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                {questionCount[0]} Questions
                            </Badge>
                        </div>
                        <Input
                            id="questions"
                            type="number"
                            min={3}
                            max={10}
                            value={questionCount[0]}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) setQuestionCount([val]);
                                else setQuestionCount([0]); // Allow clearing to type, handle onBlur
                            }}
                            onBlur={() => {
                                let val = questionCount[0];
                                if (val < 3) val = 3;
                                if (val > 10) val = 10;
                                setQuestionCount([val]);
                            }}
                            className="h-12 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                        />
                        <p className="text-xs text-muted-foreground">Enter a value between 3 and 10.</p>
                    </div>

                    {/* Mode Selection with Upsell */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <Label className="text-base flex items-center gap-2">
                                Interview Experience
                                <FeatureGuide description="Choose between a voice-only call or a realistic avatar simulation." />
                            </Label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={cn(
                                    "relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-700",
                                    mode === 'VOICE' ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800"
                                )}
                                onClick={() => setMode('VOICE')}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Mic className="w-5 h-5 text-blue-500" />
                                    <span className="font-semibold">Voice Only</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Focus purely on your verbal responses.</p>
                            </div>

                            <div
                                className={cn(
                                    "relative border-2 rounded-xl p-4 cursor-pointer transition-all group overflow-hidden",
                                    mode === 'AVATAR' ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/20" : "border-slate-200 dark:border-slate-800",
                                    !isDiamondPlan && "opacity-80 grayscale-[0.5]"
                                )}
                                onClick={() => isDiamondPlan ? setMode('AVATAR') : toast.error("Upgrade to Diamond plan for Avatar interviews!")}
                            >
                                {!isDiamondPlan && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 via-white/80 to-transparent dark:from-black/90 dark:via-black/80 p-2 text-center z-10">
                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm animate-pulse">
                                            Premium Feature
                                        </Badge>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-2">
                                    <User className="w-5 h-5 text-purple-500" />
                                    <span className="font-semibold">Avatar AI</span>
                                </div>
                                <p className="text-xs text-muted-foreground pb-4">
                                    Realistic face-to-face simulation. <span className="font-medium text-purple-600 dark:text-purple-400">Best for immersion.</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]" 
                        onClick={handleConfigSubmit}
                    >
                        Next
                    </Button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
