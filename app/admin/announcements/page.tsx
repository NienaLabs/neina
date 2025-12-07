"use client";

import { AnnouncementManager } from "@/components/admin/AnnouncementManager";

export default function AdminAnnouncementsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
            </div>
            <AnnouncementManager />
        </div>
    );
}
