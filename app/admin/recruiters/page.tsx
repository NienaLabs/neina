"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { RecruiterApplicationsTable } from "@/components/admin/RecruiterApplicationsTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, RefreshCw } from "lucide-react";

export default function RecruitersPage() {
    const [activeTab, setActiveTab] = useState("pending");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recruiter Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage recruiter applications and verify new recruiters.
                    </p>
                </div>
                {/* <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Recruiter
                </Button> */}
            </div>

            <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pending">Pending Applications</TabsTrigger>
                    <TabsTrigger value="approved">Verified Recruiters</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected Applications</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <RecruitersList status="PENDING" />
                </TabsContent>

                <TabsContent value="approved" className="mt-6">
                    <RecruitersList status="APPROVED" />
                </TabsContent>

                <TabsContent value="rejected" className="mt-6">
                    <RecruitersList status="REJECTED" />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function RecruitersList({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
    const { data: applications, isLoading, refetch } = trpc.admin.getRecruiterApplications.useQuery({
        status,
        limit: 50,
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <RecruiterApplicationsTable
                applications={applications || []}
                onUpdate={() => refetch()}
            />
        </div>
    );
}
