'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/auth-client';
import { 
  Mic, 
  Video, 
  VideoOff,
  Send, 
  Loader2,
  MessageSquare, 
  AlertCircle, 
  Volume2,
  Clock,
  Lightbulb,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
  MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type InterviewMode = 'technical' | 'behavioral' | 'system-design' | 'case-study';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isError?: boolean;
}

const InterviewAI = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // State
  const [mode, setMode] = useState<InterviewMode>('technical');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [role, setRole] = useState<string>('Software Engineer');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  // Start interview timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle video stream
  const toggleVideo = async () => {
    try {
      if (isVideoOn) {
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
      } else {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }
      setIsVideoOn(!isVideoOn);
    } catch (err) {
      toast.error('Could not access camera/microphone');
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioOn(!isAudioOn);
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

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - replace with actual API call
      const response = {
        response: `That's an excellent point about ${input.split(' ').slice(0, 3).join(' ')}. Could you elaborate more on how you would approach this in a real-world scenario?`
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key down for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check authentication
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/sign-in');
    }
  }, [session, isPending, router]);

  // Mock interview tips
  const interviewTips = [
    "Speak clearly and confidently",
    "Use the STAR method for behavioral questions",
    "Prepare questions to ask the interviewer",
    "Research the company beforehand",
    "Dress professionally, even for video interviews"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Mock Interview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Practice your interview skills with our AI interviewer
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Interview Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="interview-mode" className="block text-sm font-medium mb-2">
                    Interview Type
                  </Label>
                  <select
                    id="interview-mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as InterviewMode)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="system-design">System Design</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="role" className="block text-sm font-medium mb-2">
                    Target Role
                  </Label>
                  <input
                    type="text"
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Video</Label>
                    <p className="text-xs text-gray-500">Enable camera</p>
                  </div>
                  <Switch checked={isVideoOn} onCheckedChange={toggleVideo} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Audio</Label>
                    <p className="text-xs text-gray-500">Enable microphone</p>
                  </div>
                  <Switch checked={isAudioOn} onCheckedChange={toggleAudio} />
                </div>
              </CardContent>
            </Card>

            {showTips && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                      Interview Tips
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTips(false)}
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {interviewTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Chat */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>Interview Session</CardTitle>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              {/* Video Preview */}
              {isVideoOn && (
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-4">
                    <Button
                      variant={isVideoOn ? "default" : "destructive"}
                      size="sm"
                      onClick={toggleVideo}
                      className="rounded-full h-10 w-10 p-0"
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant={isAudioOn ? "default" : "destructive"}
                      size="sm"
                      onClick={toggleAudio}
                      className="rounded-full h-10 w-10 p-0"
                    >
                      {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-1">Start your interview</h3>
                    <p className="text-sm max-w-md">
                      Begin by sending a message or enable video to start a face-to-face interview.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'assistant'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            : 'bg-blue-600 text-white'
                        } ${message.isError ? 'border border-red-500' : ''}`}
                      >
                        <div className="flex items-start">
                          {message.role === 'assistant' && (
                            <Avatar className="h-6 w-6 mr-2 mt-0.5">
                              <AvatarImage src="/ai-avatar.png" />
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                {error && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                )}
                
                <div className="relative">
                  <Textarea
                    placeholder="Type your response here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[100px] pr-20 resize-none"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 bottom-2 flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      {isRecording ? (
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isLoading || !input.trim()}
                      className="h-8 px-4"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Feedback & Analysis */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Overall Score</h4>
                      <div className="flex items-center">
                        <div className="text-3xl font-bold mr-3">8.5</div>
                        <div className="flex-1">
                          <Progress value={85} className="h-2" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Areas of Strength</h4>
                      <div className="space-y-2">
                        {['Technical Knowledge', 'Communication', 'Problem Solving'].map((item) => (
                          <div key={item} className="flex items-center justify-between text-sm">
                            <span>{item}</span>
                            <div className="w-24">
                              <Progress value={Math.floor(Math.random() * 30) + 70} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Areas to Improve</h4>
                      <div className="space-y-2">
                        {['Time Management', 'Code Structure', 'Edge Cases'].map((item) => (
                          <div key={item} className="flex items-center justify-between text-sm">
                            <span>{item}</span>
                            <div className="w-24">
                              <Progress value={Math.floor(Math.random() * 50)} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>Complete the interview to see detailed feedback</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Transcript
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Listen to Response
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Good Answer
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Needs Improvement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewAI;