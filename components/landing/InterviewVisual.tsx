"use client"

import { Orb } from "@/components/interview/Orb"
import { Card } from "@/components/ui/card"

export default function InterviewVisual() {
  return (
    <Card className="relative w-full max-w-[320px] md:max-w-md mx-auto overflow-hidden rounded-3xl border-0 bg-gray-900/90 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
      
        <div className="relative p-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-950">
                {/* Video Background */}
                <video
                    src="/InterviewAI-Preview.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover opacity-60 mix-blend-overlay"
                />

                {/* Orb Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative h-48 w-48 md:h-64 md:w-64">
                         <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" />
                        <Orb 
                            colors={["#8B5CF6", "#D946EF"]} 
                            agentState="talking"
                        />
                    </div>
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-gray-950/80 via-transparent to-transparent pointer-events-none" />
            </div>
      </div>
    </Card>
  )
}
