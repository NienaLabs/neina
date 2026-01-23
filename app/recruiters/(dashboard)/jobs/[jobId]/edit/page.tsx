"use client";

import { RecruiterJobForm } from "@/components/recruiter/RecruiterJobForm";
import { trpc } from "@/trpc/client";
import { Loader2, ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
        <div className="container py-8 space-y-8 max-w-5xl mx-auto">
            <div className="space-y-4">
                <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-primary transition-colors">
                    <Link href="/recruiters/jobs" className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Jobs</span>
                    </Link>
                </Button>

                <div className="border-b pb-6">
                    <h1 className="text-2xl md:text-3xl tracking-tight font-syne bg-linear-to-r from-black via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Edit <span className="text-muted-foreground/40 font-normal">Job Role</span>
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Update your job posting to better reach candidates.</p>
                </div>
            </div>
            <RecruiterJobForm initialData={job} recruiterJobId={recruiterJobId} />
        </div>
    );
}
