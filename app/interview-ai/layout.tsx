import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InterviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/");
    }

    if (!(session.user as any).onboardingCompleted) {
        redirect("/onboarding");
    }

    return (
        <div className="min-h-screen bg-[#fdfcff] text-slate-900 flex flex-col relative overflow-hidden">
            {/* Vibrant Niena Brand Background */}
            <div className="absolute inset-0 bg-[radial-gradient(at_top_center,_#ede9fe_0%,_#e0e7ff_50%,_#fdfcff_100%)] z-0" />

            {/* Brand Ambient Glows - Purple and Blue */}
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-purple-500/10 blur-[100px] rounded-full z-0 animate-pulse" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full z-0 animate-pulse" />



            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-10 mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>


            {/* 1. TOP NAVIGATION BAR */}
            <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-[60] shrink-0">
                <div className="flex items-center gap-6">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500/40" />
                        <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase transition-all">
                            INTERVIEW <span className="text-purple-600">AI</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase">STUDIO ACTIVE</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden z-20">
                {children}
            </main>
        </div>
    );
}
