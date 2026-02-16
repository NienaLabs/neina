import { StatsCard } from "@/components/admin/StatsCard";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import prisma from "@/lib/prisma";
import { Users, Briefcase, Video, FileText, ArrowUpRight, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { unstable_cache } from "next/cache";

// Cache dashboard stats for 60 seconds to reduce DB load
const getDashboardStats = unstable_cache(
    async () => {
        console.log("📊 [AdminPage] Fetching dashboard stats from DB...");
        return await Promise.all([
            prisma.user.count(),
            prisma.jobs.count(),
            prisma.interview.count(),
            prisma.resume.count(),
            prisma.user.findMany({
                take: 6,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    role: true,
                    image: true
                }
            })
        ]);
    },
    ["admin-dashboard-stats"],
    { revalidate: 60, tags: ["admin-stats"] }
);

export default async function AdminPage() {
    let userCount = 0, jobCount = 0, interviewCount = 0, resumeCount = 0, recentUsers: any[] = [];

    try {
        const results = await getDashboardStats();
        [userCount, jobCount, interviewCount, resumeCount, recentUsers] = results;
    } catch (error) {
        console.error("❌ [AdminPage] Error fetching dashboard stats:", error);
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <AdminSectionHeader
                title="Admin Overview"
                description="Welcome back. Here's what's happening with Job AI today."
                action={
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <TrendingUp className="h-4 w-4" />
                        <span>System Stable</span>
                    </div>
                }
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                <StatsCard
                    title="Total Users"
                    total={userCount.toLocaleString()}
                    icon={<Users className="h-5 w-5" />}
                    trend="+12% from last month"
                />
                <StatsCard
                    title="Active Jobs"
                    total={jobCount.toLocaleString()}
                    icon={<Briefcase className="h-5 w-5" />}
                    trend="+5% new this week"
                />
                <StatsCard
                    title="Interviews"
                    total={interviewCount.toLocaleString()}
                    icon={<Video className="h-5 w-5" />}
                    trend="24 scheduled today"
                />
                <StatsCard
                    title="Resumes"
                    total={resumeCount.toLocaleString()}
                    icon={<FileText className="h-5 w-5" />}
                    trend="High activity"
                />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Recent Users Section */}
                <AdminCard
                    title="Recent Registrations"
                    description="The latest users to join the platform."
                    headerAction={
                        <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group">
                            View All <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    }
                >
                    <div className="divide-y divide-border/50">
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between py-4 group hover:bg-secondary/30 px-2 rounded-xl transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-border/50">
                                        <AvatarImage src={user.image || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                            {user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground font-syne group-hover:text-primary transition-colors">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <Badge variant="outline" className="capitalize text-[10px] font-bold tracking-wider opacity-70">
                                        {user.role}
                                    </Badge>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                        {format(new Date(user.createdAt), "MMM d, h:mm a")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </AdminCard>
            </div>
        </div>
    );
}


