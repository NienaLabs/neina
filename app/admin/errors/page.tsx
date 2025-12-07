/**
 * Admin Errors Page
 * 
 * Displays Sentry error monitoring dashboard for admins.
 */

"use client";

import { trpc } from "@/trpc/client";
import { ErrorsTable } from "@/components/admin/ErrorsTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { AlertCircle, TrendingUp, Clock } from "lucide-react";

export default function ErrorsPage() {
    const { data: issues, isLoading } = trpc.admin.getSentryIssues.useQuery({ limit: 50 });

    // Calculate stats
    const unresolvedCount = issues?.filter((i: any) => i.status === 'unresolved').length || 0;
    const totalCount = issues?.length || 0;
    const last24h = issues?.filter((i: any) => {
        const lastSeen = new Date(i.lastSeen);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastSeen > dayAgo;
    }).length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Error Monitoring</h1>
                <p className="text-muted-foreground">
                    Monitor and track application errors from Sentry
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Unresolved Errors"
                    total={unresolvedCount.toString()}
                    icon={<AlertCircle className="h-4 w-4" />}
                />
                <StatsCard
                    title="Total Errors"
                    total={totalCount.toString()}
                    icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatsCard
                    title="Last 24 Hours"
                    total={last24h.toString()}
                    icon={<Clock className="h-4 w-4" />}
                />
            </div>

            {/* Errors Table */}
            <ErrorsTable issues={issues} isLoading={isLoading} />
        </div>
    );
}
