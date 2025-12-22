"use client";

import { SupportDashboard } from "@/components/admin/SupportDashboard";

export default function AdminSupportPage() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Support Tickets</h2>
            </div>
            <SupportDashboard />
        </div>
    );
}
