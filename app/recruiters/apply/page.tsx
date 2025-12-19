"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { RecruiterApplicationForm } from "@/components/recruiter/RecruiterApplicationForm";
import { Loader2, CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/auth-client";

export default function RecruiterApplyPage() {
    const [isReapplying, setIsReapplying] = useState(false);
    const { data: session } = useSession();
    const { data: application, isLoading } = trpc.recruiter.getMyApplication.useQuery(undefined, {
        enabled: !!session?.user
    });
    const { data: user } = trpc.user.getMe.useQuery(undefined, {
        enabled: !!session?.user
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If user is already a recruiter, redirect or show message
    if (user?.role === 'recruiter') {
        return (
            <div className="container max-w-2xl mx-auto py-20 text-center space-y-6">
                <div className="mx-auto h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl font-bold">You are a Verified Recruiter!</h1>
                <p className="text-muted-foreground text-lg">
                    Access your dashboard to start posting jobs and managing candidates.
                </p>
                <Button asChild size="lg">
                    <Link href="/recruiters/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        );
    }

    // Pending Application
    if (application?.status === 'PENDING') {
        return (
            <div className="container max-w-2xl mx-auto py-20 text-center space-y-6">
                <div className="mx-auto h-24 w-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-3xl font-bold">Application Pending</h1>
                <p className="text-muted-foreground text-lg">
                    Your application to become a recruiter is currently under review.
                    We will notify you once it has been processed.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg text-left mt-8">
                    <h3 className="font-semibold mb-2">Application Details</h3>
                    <p className="text-sm text-muted-foreground">Submitted on {new Date(application.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">Company: {application.companyName}</p>
                </div>
            </div>
        );
    }

    // Rejected Application
    if (application?.status === 'REJECTED' && !isReapplying) {
        return (
            <div className="container max-w-2xl mx-auto py-20 text-center space-y-6">
                <div className="mx-auto h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-3xl font-bold">Application Rejected</h1>
                <p className="text-muted-foreground text-lg">
                    Unfortunately, your application was not approved at this time.
                </p>
                {application.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-4 rounded-lg text-left mx-auto max-w-md">
                        <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Reason:</p>
                        <p className="text-red-700 dark:text-red-300">{application.rejectionReason}</p>
                    </div>
                )}
                <div className="pt-4 flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        You can try submitting a new application with updated information.
                    </p>
                    <Button onClick={() => setIsReapplying(true)} className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Apply Again
                    </Button>
                </div>
            </div>
        );
    }

    // Show form if no application or previous one was not pending/rejected (though logic handles most cases)
    // Actually, if rejected, maybe allow re-apply? Logic here prevents it. 
    // For now, let's keep it simple. If rejected, contact support.

    return (
        <div className="container mx-auto py-10 max-w-4xl flex justify-center">
            <RecruiterApplicationForm />
        </div>
    );
}
