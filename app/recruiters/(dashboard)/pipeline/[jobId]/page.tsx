"use client";

import { CandidatePipelineBoard } from "@/components/recruiter/CandidatePipelineBoard";
import { trpc } from "@/trpc/client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PipelinePage() {
    const params = useParams();
    const recruiterJobId = params.jobId as string;

    // Fetch job details for header
    const { data: jobs, isLoading } = trpc.recruiter.getMyJobs.useQuery({});
    const job = jobs?.find(j => j.id === recruiterJobId);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="container py-20 text-center text-muted-foreground">
                Job not found or access denied.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/recruiters/jobs" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{job.job.job_title}</h1>
                    <p className="text-muted-foreground text-sm">
                        Candidate Pipeline &bull; {job.job.job_location}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <CandidatePipelineBoard recruiterJobId={recruiterJobId} />
            </div>
        </div>
    );
}
