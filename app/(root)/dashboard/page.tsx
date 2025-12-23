'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Clock,
  AlertCircle,
  Video,
  Zap,
  CheckCircle2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeatureGuide } from '@/components/FeatureGuide';

// Types matching our API response
interface DashboardData {
  name: string | null;
  email: string | null;
  image: string | null;
  credits: number;
  resumeCredits: number;
  profileCompletion: number;
  resumeStrength: number;
  jobMatchRate: number;
  aiInsight: {
    readiness: number;
    interviewCount: number;
  };
  recentActivity: {
    type: 'interview' | 'resume';
    title: string;
    date: string;
    status: string;
    id: string;
  }[];
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    posted: string;
    match: number;
    isNew: boolean;
  }[];
}

/**
 * Component that handles search params logic
 * Must be wrapped in Suspense boundary
 */
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const [showApplicationSuccess, setShowApplicationSuccess] = useState(false);
  const { mutate: applyForRecruiter } = trpc.recruiter.applyForRecruiter.useMutation();

  useEffect(() => {
    const pendingApp = localStorage.getItem("pending_recruiter_application");
    if (pendingApp) {
      try {
        const values = JSON.parse(pendingApp);
        applyForRecruiter(values, {
          onSuccess: () => {
            localStorage.removeItem("pending_recruiter_application");
            setShowApplicationSuccess(true);
            toast.success("Application submitted successfully!");
          },
          onError: (err) => {
            console.error("Failed to submit saved application", err);
            localStorage.removeItem("pending_recruiter_application");
          }
        });
      } catch (e) {
        console.error(e);
        localStorage.removeItem("pending_recruiter_application");
      }
    }

    if (searchParams.get("recruiter_application_sent") === "true") {
      setShowApplicationSuccess(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, applyForRecruiter]);

  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/user/dashboard');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/sign-in');
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good evening';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 mt-8">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error || 'Could not load dashboard'}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-900/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      {/* Search params handler wrapped in Suspense */}
      <Suspense fallback={<Spinner />}>
        <SearchParamsHandler />
      </Suspense>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent inline-flex items-center gap-2">
              {getGreeting()}, {data.name?.split(' ')[0] || 'there'}
              <FeatureGuide 
                 description="This is your personal command center. Track your resume strength, interview readiness, and recent job search activity here."
                 side="right"
              />
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your job search today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push('/interview-ai')} className="gap-2">
              <Video className="h-4 w-4" />
              Practice Interview
            </Button>
            <Button variant="outline" onClick={() => router.push('/resume')} className="gap-2">
              <FileText className="h-4 w-4" />
              New Resume
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Resume AI Credits"
            value={data.resumeCredits?.toString() || '0'}
            icon={Zap}
            description="Available to use"
            hideProgress
            gradient="from-violet-500/10 to-indigo-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
            delay={0}
          />
          <MetricCard
            title="Resume Strength"
            value={`${data.resumeStrength}/100`}
            icon={FileText}
            description="Latest analysis score"
            progress={data.resumeStrength}
             gradient="from-fuchsia-500/10 to-pink-500/10"
             iconColor="text-fuchsia-600 dark:text-fuchsia-400"
             delay={100}
          />
          <MetricCard
            title="Interview Readiness"
            value={`${data.aiInsight.readiness}%`}
            icon={Video}
            description={`${data.aiInsight.interviewCount} sessions done`}
            progress={data.aiInsight.readiness}
            gradient="from-blue-500/10 to-cyan-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
             delay={200}
          />
          <MetricCard
            title="Interview AI Credits"
            value={data.credits.toString()}
            icon={Clock}
            description="Minutes remaining"
            progress={(data.credits / 30) * 100}
            hideProgress
            gradient="from-amber-500/10 to-orange-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
             delay={300}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 mt-8">
          <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                   <Clock className="w-5 h-5"/>
                </span>
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity found. Start by creating a resume or practicing an interview!
                </div>
              ) : (
                <div className="space-y-6">
                  {data.recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4 items-start group">
                      <div className={`mt-1 p-2 rounded-full shrink-0 ${activity.type === 'interview' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                        }`}>
                        {activity.type === 'interview' ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal">
                            {activity.status}
                          </Badge>
                          {activity.type === 'interview' && activity.status === 'ANALYZED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => router.push(`/interviews/${activity.id}/result`)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              View Report
                            </Button>
                          )}
                          {activity.type === 'interview' && activity.status === 'ENDED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={async () => {
                                toast.loading('Generating analysis...', { id: activity.id });
                                try {
                                  const res = await fetch(`/api/interviews/${activity.id}/analyze`, {
                                    method: 'POST'
                                  });
                                  if (!res.ok) throw new Error('Failed to generate analysis');
                                  toast.success('Analysis complete!', { id: activity.id });
                                  router.push(`/interviews/${activity.id}/result`);
                                } catch (error) {
                                  toast.error('Failed to generate analysis', { id: activity.id });
                                }
                              }}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Generate Report
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  progress,
  hideProgress,
  gradient = "from-slate-50 to-slate-100",
  iconColor = "text-muted-foreground",
  delay = 0
}: {
  title: string;
  value: string;
  icon: any;
  description: string;
  progress?: number;
  hideProgress?: boolean;
  gradient?: string;
  iconColor?: string;
  delay?: number;
}) {
  return (
    <Card className={`border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${gradient} dark:from-slate-900 dark:to-slate-800/50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4`}>
       {/* Decorative shimmer */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
       
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm ${iconColor}`}>
           <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
            {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          {description}
        </p>
        {!hideProgress && progress !== undefined && (
          <div className="mt-3">
             <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 dark:bg-white transition-all duration-1000 ease-out" 
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
