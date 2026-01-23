"use client";

import { RecruiterJobForm } from "@/components/recruiter/RecruiterJobForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewJobPage() {
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
                        Post a <span className="text-muted-foreground/40 font-normal">New Job</span>
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Create a new job listing to attract top talent.</p>
                </div>
            </div>

            <RecruiterJobForm />
        </div>
    );
}
