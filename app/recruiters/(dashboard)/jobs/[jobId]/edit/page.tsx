"use client";

import { RecruiterJobForm } from "@/components/recruiter/RecruiterJobForm";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditJobPage() {
    const params = useParams();
    const recruiterJobId = params.jobId as string; // Note: folder name is [jobId] but usually params key matches. Let's assume folder structure jobs/[jobId]/edit

    // Fetch existing job
    // Actually getMyJobs endpoint doesn't support fetching single by ID easily unless we filter locally or add getJob endpoint.
    // Ideally we should have getJob(id).
    // But getMyJobs returns all. I can filter on client for now or add getJob to tRPC.
    // Adding getRecruiterJob to tRPC is better.
    // For now, let's use getMyJobs and filter.
    const { data: jobs, isLoading } = trpc.recruiter.getMyJobs.useQuery({});

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const job = jobs?.find(j => j.id === recruiterJobId);

    if (!job) {
        return (
            <div className="container py-20 text-center text-muted-foreground">
                Job not found or access denied.
            </div>
        );
    }

    return (
        <div className="container py-6">
            <RecruiterJobForm initialData={job} recruiterJobId={recruiterJobId} />
        </div>
    );
}
