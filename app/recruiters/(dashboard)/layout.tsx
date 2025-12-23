"use client";

import { RecruiterSidebar } from "@/components/recruiter/RecruiterSidebar";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RecruiterDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: user, isLoading } = trpc.user.getMe.useQuery();

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role !== "recruiter") {
                router.push("/recruiters/apply");
            }
        } else if (!isLoading && !user) {
            // Not authenticated, redirect to login (handled by Middleware usually, but safe fallback)
            // router.push("/auth/signin"); // Let Next.js handle it if protected
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user.role !== "recruiter") {
        return null; // Will redirect
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <RecruiterSidebar />
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
                <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
