"use client";

import { trpc } from "@/trpc/client";
import {
    Loader2,
    Users,
    Eye,
    Plus,
    Clock,
    Target,
    Zap,
    ChevronRight,
    Search,
    Filter,
    Briefcase,
    Activity,
    ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion, Variants } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

type SortOption = "newest" | "views" | "applications";

export default function RecruiterDashboardPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const { data: dashboard, isLoading } = trpc.recruiter.getRecruiterDashboardData.useQuery();

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboard) return null;

    const filteredJobs = dashboard.activeJobs
        .filter(rj =>
            rj.job.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "views") {
                return b.job._count.jobViews - a.job._count.jobViews;
            }
            if (sortBy === "applications") {
                return b._count.candidates - a._count.candidates;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const stats = [
        {
            title: "Active Roles",
            value: dashboard.stats.activeJobs,
            icon: Target,
            description: "Live listings",
            color: "text-blue-600",
            bg: "bg-blue-50",
            borderColor: "border-blue-100",
        },
        {
            title: "Candidate Pool",
            value: dashboard.stats.totalCandidates,
            icon: Users,
            description: "Total applications",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            borderColor: "border-indigo-100",
        },
        {
            title: "Reach",
            value: dashboard.stats.totalViews,
            icon: Eye,
            description: "Total impressions",
            color: "text-slate-600",
            bg: "bg-slate-50",
            borderColor: "border-slate-100",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 10, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10 max-w-7xl mx-auto"
        >
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
                <motion.div variants={itemVariants} className="space-y-1">
                    <h1 className="text-2xl md:text-3xl  tracking-tight font-syne bg-linear-to-r from-black via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {dashboard.user.companyName || "Organization"} <span className="text-muted-foreground/40 ml-1 font-normal">Dashboard</span>
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back, {dashboard.user.name.split(" ")[0]} . Monitor your recruitment data and trends.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="flex items-center gap-3">

                    <Button asChild size="lg" className="rounded-xl font-bold font-syne px-6 py-6 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all border-none  text-white">
                        <Link href="/recruiters/jobs/new">
                            <Plus className="mr-2 h-5 w-5" /> Post Job
                        </Link>
                    </Button>
                </motion.div>
            </div>

            {/* Simple Stat Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat) => (
                    <motion.div key={stat.title} variants={itemVariants}>
                        <Card className="border-indigo-100/50 shadow-sm hover:shadow-md transition-all group rounded-2xl bg-gradient-to-br from-white/90 via-white/60 to-indigo-50/30 backdrop-blur-md">
                            <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.borderColor} border`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                                    <div className="text-2xl font-bold mt-0.5">{stat.value.toLocaleString()}</div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <p className="text-xs text-muted-foreground font-medium">{stat.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-12 items-start">
                {/* Trend Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-8">
                    <Card className="border-indigo-100/50 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-white/90 via-white/60 to-indigo-50/30 backdrop-blur-md">
                        <CardHeader className="p-8 pb-0">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold">Engagement Trend</CardTitle>
                                    <CardDescription className="text-xs font-medium text-muted-foreground">Views and applications over the last 30 days</CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <span>Views</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 border-l pl-4">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span>Applicants</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[350px] p-8 pt-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboard.trendData}>
                                    <defs>
                                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.05} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="appsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.05} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val === 0 ? '' : val}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 'semibold' }}
                                        labelStyle={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}
                                        labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#viewsGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="applications"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#appsGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Side Section */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div variants={itemVariants}>
                        <Card className="border-indigo-100/50 shadow-sm rounded-2xl overflow-hidden min-h-[460px] flex flex-col bg-gradient-to-br from-white/90 via-white/60 to-indigo-50/30 backdrop-blur-md">
                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                                    <Activity className="h-4 w-4 text-primary opacity-40" />
                                </div>
                                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Live tracking feed</p>
                            </CardHeader>
                            <CardContent className="p-6 pt-4 flex-1">
                                <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[1.5px] before:bg-muted before:content-['']">
                                    {dashboard.recentActivities.length > 0 ? (
                                        dashboard.recentActivities.map((event) => {
                                            const isUpdate = new Date(event.updatedAt).getTime() > new Date(event.appliedAt).getTime() + 1000;
                                            return (
                                                <div key={event.id} className="relative pl-8">
                                                    <div className={cn(
                                                        "absolute left-0 top-1 h-[22px] w-[22px] rounded-full border-2 border-background flex items-center justify-center z-10 shadow-sm",
                                                        isUpdate ? "bg-amber-500" : "bg-emerald-500"
                                                    )}>
                                                        {isUpdate ? <Zap className="h-2.5 w-2.5 text-white" /> : <Plus className="h-2.5 w-2.5 text-white" />}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[11px] font-bold text-foreground">
                                                                {event.candidateName}
                                                            </span>
                                                            <span className="text-[9px] font-medium text-muted-foreground tabular-nums">
                                                                {formatDistanceToNow(new Date(event.updatedAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                            {isUpdate ? (
                                                                <>Moved to <span className="font-bold text-foreground">{event.status}</span></>
                                                            ) : (
                                                                <>Applied for <span className="font-bold text-foreground">{event.recruiterJob.job.job_title}</span></>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">System standby.<br />Waiting for activity...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Active Jobs Table */}
            <motion.div variants={itemVariants}>
                <Card className="border-indigo-100/50 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-white/90 via-white/60 to-indigo-50/30 backdrop-blur-md">
                    <CardHeader className="p-8 pb-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold">Active Listings</CardTitle>
                            <CardDescription className="text-xs font-medium">Manage and track your live job postings.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    className="bg-muted/30 border-transparent border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:bg-white focus:border-border transition-all w-48 font-medium outline-none"
                                    placeholder="Filter jobs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold">
                                        <Filter className="h-3.5 w-3.5 mr-2" /> Filter
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sort By</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                        <DropdownMenuRadioItem value="newest" className="text-xs font-medium rounded-lg">
                                            Newest First
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="views" className="text-xs font-medium rounded-lg">
                                            Most Views
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="applications" className="text-xs font-medium rounded-lg">
                                            Most Applications
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredJobs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b">
                                            <th className="py-4 px-8">Position</th>
                                            <th className="py-4">Status</th>
                                            <th className="py-4 text-center">Performance</th>
                                            <th className="py-4 px-8 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredJobs.map((rj) => (
                                            <tr key={rj.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-5 px-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{rj.job.job_title}</span>
                                                        <span className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(rj.createdAt), 'MMM d, yyyy')}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none rounded-md text-[9px] font-bold px-2 py-0.5">
                                                        ACTIVE
                                                    </Badge>
                                                </td>
                                                <td className="py-5">
                                                    <div className="flex items-center justify-center gap-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xs font-bold">{rj.job._count.jobViews}</span>
                                                            <span className="text-[9px] font-medium text-muted-foreground">Views</span>
                                                        </div>
                                                        <div className="flex flex-col items-center border-l pl-6">
                                                            <span className="text-xs font-bold">{rj._count.candidates}</span>
                                                            <span className="text-[9px] font-medium text-muted-foreground">Applied</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8 text-right">
                                                    <Button size="sm" variant="ghost" asChild className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary">
                                                        <Link href={`/recruiters/pipeline/${rj.id}`}>
                                                            Pipeline <ChevronRight className="ml-1 h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="max-w-[200px] mx-auto opacity-20 mb-4">
                                    <Briefcase className="h-12 w-12 mx-auto" />
                                </div>
                                <h3 className="font-bold text-lg">{searchQuery ? "No matching jobs" : "No active jobs"}</h3>
                                <p className="text-sm text-muted-foreground mt-1 px-10">
                                    {searchQuery ? `We couldn't find any jobs matching "${searchQuery}"` : "Start by creating your first job posting to see insights here."}
                                </p>
                                {!searchQuery && (
                                    <Button asChild className="rounded-xl font-bold mt-6 h-10 px-6">
                                        <Link href="/recruiters/jobs/new">Launch Listing</Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
