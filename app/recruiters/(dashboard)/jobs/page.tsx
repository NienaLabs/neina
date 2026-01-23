"use client";

import { trpc } from "@/trpc/client";
import { RecruiterJobsTable } from "@/components/recruiter/RecruiterJobsTable";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RecruiterJobsPage() {
    const { data: jobs, isLoading, refetch } = trpc.recruiter.getMyJobs.useQuery({});

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Fetching roles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl tracking-tight font-syne bg-linear-to-r from-black via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Job <span className="text-muted-foreground/40 font-normal">Management</span>
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">Manage your active postings and review recruitment performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="lg" className="rounded-xl font-bold h-12" onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button asChild size="lg" className="rounded-xl font-bold font-syne h-12 px-6 shadow-md hover:shadow-lg transition-all border-none text-white">
                        <Link href="/recruiters/jobs/new">
                            <Plus className="mr-2 h-5 w-5" /> Post New Job
                        </Link>
                    </Button>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <RecruiterJobsTable jobs={jobs || []} onUpdate={() => refetch()} />
            </motion.div>
        </div>
    );
}
