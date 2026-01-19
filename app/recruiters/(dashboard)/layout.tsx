"use client";

import { RecruiterSidebar } from "@/components/recruiter/RecruiterSidebar";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function RecruiterDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: user, isLoading } = trpc.user.getMe.useQuery();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/");
            } else if (user.role !== "recruiter") {
                router.push("/recruiters/apply");
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse font-syne uppercase tracking-widest">Neina</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== "recruiter") {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/50">
            <RecruiterSidebar />

            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
                <main className="flex-1">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mx-auto max-w-screen-2xl p-6 md:p-8 lg:p-10"
                    >
                        {children}
                    </motion.div>
                </main>

                <footer className="px-10 py-6 border-t border-border/40 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    <span>© 2026 Neina AI</span>
                </footer>
            </div>
        </div>
    );
}
