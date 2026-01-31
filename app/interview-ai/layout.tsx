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

            {/* Ambient Studio Visual - Floating Digital Lens */}
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-0">
                <div className="relative w-[95vw] md:w-[80vw] lg:w-[70vw] aspect-video max-w-7xl rounded-t-[4rem] overflow-hidden border border-purple-500/10 shadow-[0_-20px_100px_rgba(168,85,247,0.15)] opacity-100 translate-y-7">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="/InterviewAI-Preview.mp4" type="video/mp4" />
                    </video>

                    {/* Premium Studio Overlays - Reduced to increase video clarity */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fdfcff] via-transparent to-[#fdfcff] opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#fdfcff] via-transparent to-[#fdfcff] opacity-20" />

                    {/* Subtle Scanline Effect for that "Studio monitor" feel */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.02)_50%),linear-gradient(90deg,rgba(168,85,247,0.01),rgba(59,130,246,0.01))] bg-[length:100%_4px,4px_100%] pointer-events-none" />
                </div>
            </div>

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-10 mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>

            {/* Standalone Header - Premium Light Glassmorphism */}
            <header className="h-16 border-b border-purple-500/5 bg-white/40 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse" />
                        <span className="text-sm font-bold tracking-tight text-slate-800 uppercase">
                            Interview <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent italic">AI</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-purple-500/10 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Studio Active</span>
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
