"use client";

import { NotificationList } from "@/components/notifications/NotificationList";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Bell } from "lucide-react";

export default function AdminNotificationsPage() {
    return (
        <div className="space-y-6">
            <AdminSectionHeader
                title="System Notifications"
                description="Manage and view alerts and messages from users and the system."
                action={
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Bell className="h-5 w-5" />
                    </div>
                }
            />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                    <NotificationList />
                </div>
            </div>
        </div>
    );
}
