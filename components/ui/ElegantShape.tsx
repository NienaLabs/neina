"use client";

import { motion, useMotionValue, useTransform, animate, Variants } from "framer-motion";
import { ArrowRight, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

function HeroGeometric({
    badge = "Design Collective",
    title1 = "Elevate Your Digital Vision",
    title2 = "Crafting Exceptional Websites",
}: {
    badge?: string;
    title1?: string;
    title2?: string;
}) {
      const router = useRouter();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  const fadeUpVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1] as const,
            },
        }),
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center overflow-hidden bg-[#030303]">
            {/* Header */}
            <header className="w-full fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center">
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
                            JobAI
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
                        <Link 
                          href="#features" 
                          onClick={(e) => scrollToSection(e, 'features')}
                          className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                        >
                          Features
                        </Link>
                        <Link 
                          href="#testimonials" 
                          onClick={(e) => scrollToSection(e, 'testimonials')}
                          className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                        >
                          Testimonials
                        </Link>
                        <Link 
                          href="#how-it-works" 
                          onClick={(e) => scrollToSection(e, 'how-it-works')}
                          className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                        >
                          How It Works
                        </Link>
                      
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        <Link href="/auth/sign-in" className="hidden md:inline-block text-sm font-medium text-white/80 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link 
                            href="/auth/sign-up" 
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="w-full flex-1 flex items-center justify-center pt-20 md:pt-24">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

                <div className="absolute inset-0 overflow-hidden">
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
                        <motion.div
                            custom={0}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
                        >
                            <Circle className="h-2 w-2 fill-rose-500/80" />
                            <span className="text-sm text-white/60 tracking-wide">
                                {badge}
                            </span>
                        </motion.div>

                        <motion.div
                            custom={1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                                    {title1}
                                </span>
                                <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                                    {title2}
                                </span>
                            </h1>
                        </motion.div>

                        <motion.div
                            custom={2}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                                Find your dream job with our AI-powered tools that help you create the perfect resume and ace your interviews.
                            </p>
                            <Link
                                href="/auth/sign-in"
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 mb-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
            </div>
        </div>
    );
}

export { HeroGeometric }
