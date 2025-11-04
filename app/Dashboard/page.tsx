'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/auth-client';
import { 
  ChartBarIcon, 
  RocketLaunchIcon, 
  ArrowUpRightIcon,
  ClockIcon,
  CheckCircleIcon,
  LightBulbIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR
const Sidebar = dynamic(() => import('@/app/components/dashboard/Sidebar'), { 
  ssr: false,
  loading: () => (
    <div className="w-64 h-screen bg-gray-800 animate-pulse"></div>
  )
});

const Header = dynamic(() => import('@/app/components/dashboard/Header'), {
  ssr: false,
  loading: () => (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
  )
});

const CareerSnapshot = dynamic(() => import('@/app/components/dashboard/CareerSnapshot'), {
  loading: () => <Skeleton className="h-64 w-full rounded-2xl" />
});

const AIInsights = dynamic(() => import('@/app/components/dashboard/AIInsights'), {
  loading: () => <Skeleton className="h-48 w-full rounded-2xl" />
});

const JobOpenings = dynamic(() => import('@/app/components/dashboard/JobOpenings'), {
  loading: () => <Skeleton className="h-64 w-full rounded-2xl" />
});

const QuickActions = dynamic(() => import('@/app/components/dashboard/QuickActions'), {
  loading: () => <Skeleton className="h-48 w-full rounded-2xl" />
});

// Types
export interface Job {
  id: number;
  title: string;
  company: string;
  match: number;
  logo?: string;
  location: string;
  type: string;
  postedDate?: string;
  salaryRange?: string;
  isNew?: boolean;
  isApplied?: boolean;
}

type GradientColor = "blue" | "green" | "purple" | "orange";

export interface AIInsight {
  readiness: number;
  nextStep: string;
  summary: string;
  lastUpdated?: string;
  improvementAreas?: string[];
  strengthAreas?: string[];
}

export interface UserData {
  name: string;
  email?: string;
  role: string;
  profileCompletion: number;
  credits: number;
  interviewMinutes: number;
  resumeStrength: number;
  jobMatchRate: number;
  roadmapProgress: number;
  lastActive?: string;
  memberSince?: string;
  aiInsight: AIInsight;
  jobs: Job[];
  recentActivity?: {
    type: 'application' | 'interview' | 'skill_added' | 'resume_updated';
    title: string;
    date: string;
    status?: 'pending' | 'completed' | 'rejected';
  }[];
}

// Gradient color utility
const getGradient = (color: GradientColor): string => {
  switch (color) {
    case "blue":
      return "from-blue-500 to-blue-400";
    case "green":
      return "from-green-500 to-green-400";
    case "purple":
      return "from-purple-500 to-purple-400";
    default:
      return "from-gray-500 to-gray-400";
  }
};

// Stat component props type
type StatProps = {
  label: string;
  value: number;
  color: GradientColor;
};

// Animated stat bar
const Stat: React.FC<StatProps> = ({ label, value, color }) => {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {safeValue}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full bg-linear-to-r ${getGradient(color)}`}
          style={{
            width: `${safeValue}%`,
            transition: "width 1s ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

// Stats card component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center">
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}% from last month
          </span>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API call
        // const response = await fetch('/api/user/dashboard');
        // const data = await response.json();
        // setUserData(data);
        
        // Mock data for now
        setTimeout(() => {
          setUserData({
            name: "Evan",
            email: "evan@example.com",
            role: "Junior Developer",
            profileCompletion: 75,
            credits: 5,
            interviewMinutes: 30,
            resumeStrength: 65,
            jobMatchRate: 78,
            roadmapProgress: 40,
            memberSince: "2023-01-15",
            lastActive: new Date().toISOString(),
            aiInsight: {
              readiness: 70,
              nextStep: "Practice behavioral interview questions",
              summary: "Your technical skills are strong, but interview performance could use some work.",
              lastUpdated: new Date().toISOString(),
              improvementAreas: ["Behavioral interviews", "System design"],
              strengthAreas: ["JavaScript", "React", "TypeScript"]
            },
            jobs: [
              { 
                id: 1, 
                title: "Frontend Developer", 
                company: "Tech Corp", 
                match: 85,
                location: "San Francisco, CA",
                type: "Full-time",
                postedDate: "2 days ago",
                salaryRange: "$90,000 - $130,000",
                isNew: true
              },
              { 
                id: 2, 
                title: "React Developer", 
                company: "Web Solutions", 
                match: 78,
                location: "Remote",
                type: "Full-time",
                postedDate: "1 week ago",
                salaryRange: "$85,000 - $120,000"
              },
              {
                id: 3,
                title: "Junior Full Stack Developer",
                company: "Digital Creations",
                match: 92,
                location: "New York, NY",
                type: "Full-time",
                postedDate: "3 days ago",
                salaryRange: "$95,000 - $125,000",
                isNew: true
              },
            ],
            recentActivity: [
              {
                type: 'application',
                title: 'Applied for Senior Frontend Developer at TechCorp',
                date: '2023-05-15T14:30:00Z',
                status: 'pending'
              },
              {
                type: 'interview',
                title: 'Technical Interview with Acme Inc',
                date: '2023-05-12T10:00:00Z',
                status: 'completed'
              },
              {
                type: 'resume_updated',
                title: 'Updated resume with new project',
                date: '2023-05-10T16:45:00Z'
              }
            ]
          });
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    } else if (!isPending) {
      router.push('/auth/sign-in');
    }
  }, [session, isPending, router]);

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
          <div className="p-6 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Unable to load dashboard data'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto pt-6 pb-10 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <section className="mb-8">
            <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Welcome back, {new Date().toLocaleDateString('en-US', { weekday: 'long' })}! 👋</p>
                  <h1 className="mt-1 text-2xl md:text-3xl font-bold">
                    {userData.name}
                  </h1>
                  <p className="mt-2 text-blue-100 max-w-2xl">
                    {userData.aiInsight.summary}
                  </p>
                </div>
                <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
                  <button 
                    onClick={() => router.push('/interview-ai')}
                    className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium flex items-center gap-2 transition-colors border border-white/20"
                  >
                    <RocketLaunchIcon className="w-5 h-5" />
                    Practice Interview
                  </button>
                  <button 
                    onClick={() => router.push('/resume-builder')}
                    className="px-5 py-3 rounded-xl bg-white text-blue-600 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Update Resume
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Profile Score" 
              value={`${userData.profileCompletion}%`} 
              icon={UserIcon} 
              trend={5.2}
              color="blue"
            />
            <StatCard 
              title="Resume Strength" 
              value={`${userData.resumeStrength}%`} 
              icon={DocumentTextIcon} 
              trend={3.8}
              color="green"
            />
            <StatCard 
              title="Job Match Rate" 
              value={`${userData.jobMatchRate}%`} 
              icon={ChartBarIcon} 
              trend={7.1}
              color="purple"
            />
            <StatCard 
              title="Interview Readiness" 
              value={`${userData.aiInsight.readiness}%`} 
              icon={LightBulbIcon} 
              trend={4.5}
              color="orange"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
                <CareerSnapshot userData={userData} />
              </Suspense>
              
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
                <AIInsights insight={userData.aiInsight} />
              </Suspense>
              
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
                <JobOpenings jobs={userData.jobs} />
              </Suspense>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
                <QuickActions />
              </Suspense>
              
              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    View All
                  </button>
                </div>
                
                <div className="space-y-4">
                  {userData.recentActivity?.slice(0, 3).map((activity, index) => (
                    <div key={index} className="flex items-start pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 mt-0.5">
                        {activity.type === 'application' && <DocumentTextIcon className="h-5 w-5" />}
                        {activity.type === 'interview' && <ChatBubbleLeftRightIcon className="h-5 w-5" />}
                        {activity.type === 'resume_updated' && <ArrowUpRightIcon className="h-5 w-5" />}
                        {activity.type === 'skill_added' && <LightBulbIcon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          <span>{new Date(activity.date).toLocaleDateString()}</span>
                          {activity.status && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              activity.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : activity.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!userData.recentActivity || userData.recentActivity.length === 0) && (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <Stat
                    label="Profile Completion"
                    value={userData.profileCompletion}
                    color="blue"
                  />
                  <Stat
                    label="Resume Strength"
                    value={userData.resumeStrength}
                    color="green"
                  />
                  <Stat
                    label="Job Match Rate"
                    value={userData.jobMatchRate}
                    color="purple"
                  />
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Interview Readiness</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {userData.aiInsight.readiness}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-linear-to-r from-yellow-500 to-orange-500"
                        style={{ width: `${userData.aiInsight.readiness}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Next Steps
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5">
                        <CheckCircleIcon className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {userData.aiInsight.nextStep}
                      </p>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                      View Full Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
