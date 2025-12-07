"use client";

import { trpc } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, Video, Briefcase, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsDashboard() {
    const { data: overview, isLoading: overviewLoading } = trpc.admin.getAnalyticsOverview.useQuery();
    const { data: userGrowth, isLoading: growthLoading } = trpc.admin.getUserGrowth.useQuery({ days: 30 });
    const { data: featureUsage, isLoading: featureLoading } = trpc.admin.getFeatureUsage.useQuery();
    const { data: jobStats, isLoading: jobsLoading } = trpc.admin.getJobStats.useQuery();

    if (overviewLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Prepare feature usage data for chart
    const featureChartData = featureUsage ?
        Array.from(new Set([
            ...featureUsage.resumes.map(r => r.date),
            ...featureUsage.interviews.map(i => i.date),
            ...featureUsage.tailored.map(t => t.date),
        ])).sort().map(date => ({
            date,
            resumes: featureUsage.resumes.find(r => r.date === date)?.count || 0,
            interviews: featureUsage.interviews.find(i => i.date === date)?.count || 0,
            tailored: featureUsage.tailored.find(t => t.date === date)?.count || 0,
        })) : [];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            +{overview?.newUsers || 0} this week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview?.activeUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Last 30 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview?.totalResumes || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Created by users
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview?.totalJobs || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            In database
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* User Growth Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>User Growth (Last 30 Days)</CardTitle>
                    <CardDescription>Daily new user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                    {growthLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={userGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Users" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Feature Usage Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Feature Usage (Last 30 Days)</CardTitle>
                    <CardDescription>Resumes, Interviews, and Tailored Resumes created</CardDescription>
                </CardHeader>
                <CardContent>
                    {featureLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={featureChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="resumes" stroke="#8884d8" name="Resumes" />
                                <Line type="monotone" dataKey="interviews" stroke="#82ca9d" name="Interviews" />
                                <Line type="monotone" dataKey="tailored" stroke="#ffc658" name="Tailored" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Job Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Jobs Added (Last 30 Days)</CardTitle>
                        <CardDescription>Daily job additions to the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {jobsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={jobStats?.jobsByDay || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8884d8" name="Jobs Added" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Remote vs On-site Jobs</CardTitle>
                        <CardDescription>Distribution of job types</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {jobsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={jobStats?.remoteStats || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.type}: ${entry.count}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {jobStats?.remoteStats?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Locations */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Job Locations</CardTitle>
                    <CardDescription>Most common job locations in the database</CardDescription>
                </CardHeader>
                <CardContent>
                    {jobsLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={jobStats?.topLocations || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="location" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#82ca9d" name="Jobs" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
