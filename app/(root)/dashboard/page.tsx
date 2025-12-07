'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Clock,
  AlertCircle,
  Video,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
            router.push('/auth/signin');
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getGreeting()}, {data.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your job search today.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Resume AI Credits"
            value={data.resumeCredits?.toString() || '0'}
            icon={Zap}
            description="Available for generation"
            hideProgress
          />
          <MetricCard
            title="Resume Strength"
            value={`${data.resumeStrength}/100`}
            icon={FileText}
            description="Based on latest analysis"
            progress={data.resumeStrength}
          />
          <MetricCard
            title="Interview Readiness"
            value={`${data.aiInsight.readiness}%`}
            icon={Video}
            description={`${data.aiInsight.interviewCount} sessions completed`}
            progress={data.aiInsight.readiness}
          />
          <MetricCard
            title="Interview AI Credits Remaining"
            value={data.credits.toString()}
            icon={Clock}
            description="Minutes available"
            progress={(data.credits / 30) * 100}
            hideProgress
          />
        </div>

        <div className="grid grid-cols-1 gap-8 mt-8">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
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
  hideProgress
}: {
  title: string;
  value: string;
  icon: any;
  description: string;
  progress?: number;
  hideProgress?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
        {!hideProgress && progress !== undefined && (
          <Progress value={progress} className="h-1 mt-3" />
        )}
      </CardContent>
    </Card>
  );
}
