"use client";

import { CandidatePipelineBoard } from "@/components/recruiter/CandidatePipelineBoard";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronLeft } from "lucide-react";
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
                <div className="space-y-4">
                    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-primary transition-colors">
                        <Link href="/recruiters/jobs" className="flex items-center gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Back to Jobs</span>
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-syne bg-linear-to-r from-black via-indigo-600 to-purple-600 bg-clip-text text-transparent line-clamp-1 max-w-xl">
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
