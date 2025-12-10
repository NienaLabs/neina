"use client";

import { trpc } from "@/trpc/client";
import { RecruiterJobsTable } from "@/components/recruiter/RecruiterJobsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function RecruiterJobsPage() {
    const { data: jobs, isLoading, refetch } = trpc.recruiter.getMyJobs.useQuery({});

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your job postings and track applications.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/recruiters/jobs/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Post New Job
                    </Link>
                </Button>
            </div>

            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <RecruiterJobsTable jobs={jobs || []} onUpdate={() => refetch()} />
        </div>
    );
}
