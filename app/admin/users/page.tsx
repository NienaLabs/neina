"use client";

import { UsersTable } from "@/components/admin/UsersTable";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const utils = trpc.useUtils();

    const sendGlobalMutation = trpc.admin.sendGlobalJobNotifications.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (err) => {
            toast.error(err.message || "Failed to send global alerts");
        }
    });

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => sendGlobalMutation.mutate()}
                        disabled={sendGlobalMutation.isPending}
                    >
                        <BellRing className="mr-2 h-4 w-4" />
                        {sendGlobalMutation.isPending ? 'Sending...' : 'Send Job Alerts to All'}
                    </Button>
                </div>
            </div>
            <UsersTable />
        </div>
    );
}
