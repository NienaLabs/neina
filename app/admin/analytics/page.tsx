"use client";

import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export default function AdminAnalyticsPage() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            </div>
            <AnalyticsDashboard />
        </div>
    );
}
