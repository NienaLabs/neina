"use client";

import { SupportDashboard } from "@/components/admin/SupportDashboard";

export default function AdminSupportPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-syne font-bold tracking-tight">Support Center</h2>
                    <p className="text-muted-foreground">Manage and resolve user support requests.</p>
                </div>
            </div>
            <SupportDashboard />
        </div>
    );
}
