"use client";

import { CandidatePipelineBoard } from "@/components/recruiter/CandidatePipelineBoard";
import { trpc } from "@/trpc/client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function PipelinePage() {
    const params = useParams();
    const recruiterJobId = params.jobId as string;

    // Fetch job details for header
    const { data: jobs, isLoading } = trpc.recruiter.getMyJobs.useQuery({});
    const job = jobs?.find(j => j.id === recruiterJobId);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Loading pipeline...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="py-20 text-center">
                <p className="text-sm font-medium text-muted-foreground">Job position not found or access denied.</p>
                <Link href="/recruiters/jobs" className="text-xs font-bold text-primary uppercase mt-4 block hover:underline">Return to Jobs</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
                <div className="flex items-center gap-4">
                    <Link href="/recruiters/jobs" className="h-10 w-10 rounded-xl border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight font-syne bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent line-clamp-1 max-w-xl">
                            {job.job.job_title} <span className="text-muted-foreground/40 font-normal">Pipeline</span>
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">{job.job.job_location} &bull; Manage and track candidate progress.</p>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex-1 overflow-hidden"
            >
                <CandidatePipelineBoard recruiterJobId={recruiterJobId} />
            </motion.div>
        </div>
    );
}
