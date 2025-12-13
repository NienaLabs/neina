'use client'

import React, { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, MessageSquare, Briefcase } from 'lucide-react'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

const FeatureCards = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const leftCardRef = useRef<HTMLDivElement>(null)
    const middleCardRef = useRef<HTMLDivElement>(null)
    const rightCardRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                end: "bottom 80%",
                toggleActions: "play none none reverse"
            }
        })

        // Initial states are handled by 'from' tweens
        
        // Left Card: From left, tilted left
        tl.from(leftCardRef.current, {
            x: -200,
            rotation: -15,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, 0)

        // Middle Card: From bottom, straight
        tl.from(middleCardRef.current, {
            y: 200,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, 0.2) // Slight delay

        // Right Card: From right, tilted right
        tl.from(rightCardRef.current, {
            x: 200,
            rotation: 15,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, 0)

    }, { scope: containerRef })

    return (
        <section ref={containerRef} className="py-20 px-4 md:px-8 bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch perspective-[1000px]">
                    
                    {/* Resume AI - Left Card */}
                    <div ref={leftCardRef} className="will-change-transform">
                        <Card className="h-full border-blue-100 dark:border-blue-900 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                                    <FileText size={24} />
                                </div>
                                <CardTitle className="text-xl">Resume AI</CardTitle>
                                <CardDescription>Smart Optimization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Tailor your resume for every application. Our AI analyzes job descriptions and optimizes your content to beat ATS systems.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Interview AI - Middle Card */}
                    <div ref={middleCardRef} className="will-change-transform">
                        <Card className="h-full border-purple-100 dark:border-purple-900 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300 relative z-10 md:-mt-4 md:shadow-xl border-t-4 border-t-purple-500">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                                    <MessageSquare size={24} />
                                </div>
                                <CardTitle className="text-xl">Interview Coach</CardTitle>
                                <CardDescription>Real-time Practice</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Practice with our humanoid AI avatar. Get instant feedback on your tone, pace, and answer quality to ace your interview.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Job Search - Right Card */}
                    <div ref={rightCardRef} className="will-change-transform">
                        <Card className="h-full border-amber-100 dark:border-amber-900 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                                    <Briefcase size={24} />
                                </div>
                                <CardTitle className="text-xl">Smart Match</CardTitle>
                                <CardDescription>Intelligent Search</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Stop endless scrolling. Get job recommendations that actually match your skills, experience, and career goals.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default FeatureCards
