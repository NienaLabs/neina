"use client"

import { useRef, useMemo } from "react"
import { ArrowRight, Circle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

interface ElegantShapeProps {
    className?: string
    delay?: number
    width?: number
    height?: number
    rotate?: number
    gradient?: string
}

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: ElegantShapeProps) {
    const shapeRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!shapeRef.current) return

        // Initial Entrance
        gsap.fromTo(
            shapeRef.current,
            {
                opacity: 0,
                y: -150,
                rotation: rotate - 15,
            },
            {
                opacity: 1,
                y: 0,
                rotation: rotate,
                duration: 2.4,
                delay: delay,
                ease: "power2.out",
            }
        )

        // Continuous Floating
        gsap.to(shapeRef.current, {
            y: 15,
            duration: "random(6, 12)", // Random duration for organic feel
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: delay + 2.4, // Wait for entrance to finish
        })
    }, { scope: shapeRef, dependencies: [delay, rotate] })

    return (
        <div
            ref={shapeRef}
            className={cn("absolute", className)}
            style={{ width, height }} // Set dimensions on the container to avoid layout shifts? No, absolute positioning.
        >
            <div
                style={{
                    width,
                    height,
                }}
                className={cn(
                    "relative",
                    "bg-linear-to-r to-transparent",
                    gradient,
                    "backdrop-blur-[2px] border-2 border-white/15",
                    "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                    "after:absolute after:inset-0 after:rounded-full",
                    "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
                    "rounded-full"
                )}
            />
        </div>
    )
}

interface HeroGeometricProps {
    badge?: string
    title1?: string
    title2?: string
}

export function HeroGeometric({
    badge = "Design Future",
    title1 = "Elevate Your",
    title2 = "Digital Vision",
}: HeroGeometricProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLDivElement>(null)
    const badgeRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    
    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        // Staggered reveal for content
        tl.fromTo(
            [badgeRef.current, titleRef.current?.children, textRef.current],
            {
                y: 50,
                opacity: 0,
                filter: "blur(10px)",
            },
            {
                y: 0,
                opacity: 1,
                filter: "blur(0px)",
                duration: 1,
                stagger: 0.2, // Stagger delays between elements
                delay: 0.5,
            }
        )

        // Parallax Effect on Mouse Move
        const handleMouseMove = (e: MouseEvent) => {
             if (!containerRef.current) return
             
             const { clientX, clientY } = e
             const { innerWidth, innerHeight } = window
             
             const x = (clientX / innerWidth - 0.5) * 2 // Range -1 to 1
             const y = (clientY / innerHeight - 0.5) * 2 // Range -1 to 1

            // Move shapes based on class name or safer selector
            // We can target all .absolute children that are shapes.
            // For now, let's just gently move the whole background container or specific shapes if we can select them.
            // A better way is to pass the mouse coordinates to ElegantShape or use context, but for simplicity/perf:
            
            // Move the container of shapes slightly in opposite direction
             gsap.to(".elegant-shape-container", {
                 x: x * -20,
                 y: y * -20,
                 duration: 1,
                 ease: "power2.out",
                 overwrite: "auto"
             })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)

    }, { scope: containerRef })

    return (
        <div 
            ref={containerRef}
            className="relative min-h-screen w-full flex flex-col items-center overflow-hidden bg-[#030303]"
        >
            {/* Main Content */}
            <div className="w-full flex-1 flex items-center justify-center pt-20 md:pt-24">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-rose-500/5 blur-3xl" />

                <div className="absolute inset-0 overflow-hidden elegant-shape-container pointer-events-none">
                    <ElegantShape
                        delay={0.3}
                        width={600}
                        height={140}
                        rotate={12}
                        gradient="from-indigo-500/[0.15]"
                        className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                    />

                    <ElegantShape
                        delay={0.5}
                        width={500}
                        height={120}
                        rotate={-15}
                        gradient="from-rose-500/[0.15]"
                        className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                    />

                    <ElegantShape
                        delay={0.4}
                        width={300}
                        height={80}
                        rotate={-8}
                        gradient="from-violet-500/[0.15]"
                        className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                    />

                    <ElegantShape
                        delay={0.6}
                        width={200}
                        height={60}
                        rotate={20}
                        gradient="from-amber-500/[0.15]"
                        className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                    />

                    <ElegantShape
                        delay={0.7}
                        width={150}
                        height={40}
                        rotate={-25}
                        gradient="from-cyan-500/[0.15]"
                        className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                    />
                </div>

                <div className="relative z-10 container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <div
                            ref={badgeRef}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/3 border border-white/8 mb-8 md:mb-12 opacity-0"
                        >
                            <Circle className="h-2 w-2 fill-rose-500/80" />
                            <span className="text-sm text-white/60 tracking-wide">
                                {badge}
                            </span>
                        </div>

                        <div ref={titleRef} className="mb-6 md:mb-8">
                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight">
                                <span className="bg-clip-text text-transparent bg-linear-to-b from-white to-white/80 inline-block">
                                    {title1}
                                </span>
                                <br />
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-300 via-white/90 to-rose-300 inline-block">
                                    {title2}
                                </span>
                            </h1>
                        </div>

                        <div ref={textRef} className="opacity-0">
                            <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                                Land your next role with our AI-powered tools that help you create the perfect resume, ace your interviews and match the right job.
                            </p>
                            <Link
                                href="/auth/sign-in"
                                className="inline-flex items-center justify-center gap-2 px-6 py-5 mb-8 rounded-full  border bg-white/5 border-white/10 backdrop-blur-xl inset-shadow-sm/50 inset-shadow-indigo-500 text-white font-medium hover:opacity-50 transition-opacity"
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 bg-linear-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
            </div>
        </div>
    )
}
