"use client";

import { trpc } from "@/trpc/client";
import { Loader2, Briefcase, Users, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RecruiterDashboardPage() {
    const { data: analytics, isLoading } = trpc.recruiter.getOverallAnalytics.useQuery();
    const { data: user } = trpc.user.getMe.useQuery();

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = [
        {
            title: "Active Jobs",
            value: analytics?.jobsByStatus.find(s => s.status === 'ACTIVE')?.count || 0,
            icon: Briefcase,
            description: "Currently posted jobs",
        },
        {
            title: "Total Candidates",
            value: analytics?.totalCandidates || 0,
            icon: Users,
            description: "Applications received",
        },
        {
            title: "Total Views",
            value: analytics?.totalViews || 0,
            icon: Eye,
            description: "Job post views",
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome back, {user?.name}. Here's what's happening with your jobs.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/recruiters/jobs/new">Post a New Job</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity or Quick Actions could go here */}
            {/* For now, just a placeholder or list of recent jobs? */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Analytics charts coming soon
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/recruiters/jobs/new">
                                <Briefcase className="mr-2 h-4 w-4" /> Post a Job
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/recruiters/jobs">
                                <Users className="mr-2 h-4 w-4" /> Manage Candidates
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
