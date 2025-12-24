'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewResult {
    id: string;
    role: string;
    analysisScore: number;
    analysisFeedback: string;
    transcript: { role: string; content: string }[];
    analyzedAt: string;
    start_time: string;
    duration_seconds: number;
}

export default function InterviewResultPage() {
    const params = useParams();
    const router = useRouter();
    const [result, setResult] = useState<InterviewResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, []);

    const fetchResult = async () => {
        try {
            const res = await fetch(`/api/interviews/${params.id}`);
            if (!res.ok) throw new Error('Failed to fetch result');
            const data = await res.json();
            setResult(data);
        } catch (error) {
            toast.error('Failed to load interview results');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading your results...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="container mx-auto p-6">
                <Card className="max-w-md mx-auto mt-20">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Interview Not Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">This interview doesn't exist or you don't have access to it.</p>
                        <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const scoreColor = result.analysisScore >= 70 ? 'text-green-600 dark:text-green-400' : result.analysisScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
    const scoreGrade = result.analysisScore >= 90 ? 'Excellent' : result.analysisScore >= 70 ? 'Good' : result.analysisScore >= 50 ? 'Fair' : 'Needs Improvement';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container mx-auto p-6 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4 -ml-2">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Interview Performance Report</h1>
                            <p className="text-muted-foreground mt-1">
                                {result.role} • {new Date(result.analyzedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        {result && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        toast.loading('Generating PDF...', { id: 'pdf-export' });

                                        // Dynamically import pdf function
                                        const { pdf } = await import('@react-pdf/renderer');
                                        const { InterviewPDF } = await import('@/components/InterviewPDF');

                                        // Generate PDF blob
                                        const blob = await pdf(<InterviewPDF result={result} />).toBlob();

                                        // Create download link
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `interview-report-${result.role.replace(/\s+/g, '-').toLowerCase()}-${new Date(result.analyzedAt).toISOString().split('T')[0]}.pdf`;
                                        link.click();

                                        // Cleanup
                                        URL.revokeObjectURL(url);

                                        toast.success('PDF downloaded!', { id: 'pdf-export' });
                                    } catch (error) {
                                        console.error('PDF generation error:', error);
                                        toast.error('Failed to generate PDF', { id: 'pdf-export' });
                                    }
                                }}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Score & Metrics */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Overall Score Card */}
                        <Card className="border-2">
                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center pb-6">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="transform -rotate-90 w-40 h-40">
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
                                            strokeDasharray={`${2 * Math.PI * 70}`}
                                            strokeDashoffset={`${2 * Math.PI * 70 * (1 - result.analysisScore / 100)}`}
                                            className={scoreColor}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute">
                                        <div className={`text-5xl font-bold ${scoreColor}`}>{result.analysisScore}</div>
                                        <div className="text-sm text-muted-foreground">out of 100</div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Badge variant={result.analysisScore >= 70 ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                                        {scoreGrade}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Session Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Duration</span>
                                    <span className="font-medium">{Math.floor(result.duration_seconds / 60)}m {result.duration_seconds % 60}s</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Questions</span>
                                    <span className="font-medium">{Math.floor(result.transcript.length / 2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Analyzed</span>
                                    <span className="font-medium text-xs">{new Date(result.analyzedAt).toLocaleTimeString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Feedback & Transcript */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* AI Feedback */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    AI Performance Analysis
                                </CardTitle>
                                <CardDescription>Detailed feedback based on your responses and communication style</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-semibold prose-p:text-sm prose-li:text-sm">
                                    <div dangerouslySetInnerHTML={{
                                        __html: (result.analysisFeedback || 'No feedback available yet.')
                                            .replace(/\n/g, '<br />')
                                            .replace(/### /g, '<h3 class="mt-4 mb-2">')
                                            .replace(/- /g, '• ')
                                    }} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transcript */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Full Conversation Transcript</CardTitle>
                                <CardDescription>Complete record of your interview session</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {Array.isArray(result.transcript) ? result.transcript.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                    : 'bg-muted rounded-bl-sm'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold opacity-70">
                                                        {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-muted-foreground py-8">No transcript available for this session.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
