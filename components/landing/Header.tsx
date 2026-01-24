"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useScroll } from "@/hooks/use-scroll"
import Image from 'next/image'
import { useSession } from '@/auth-client'

const Header = () => {
    const router = useRouter()
    const [isProductsOpen, setIsProductsOpen] = useState(false)
    const isScrolled = useScroll()
    const { data: session } = useSession()


    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            router.push(`/#${sectionId}`);
        }
    };


    return (
        <header className={cn(
            "w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
            isScrolled && "bg-black/40 backdrop-blur-xl backdrop-saturate-150 border-white/10  shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        )}>
            {/* Gradient Shine Line */}
            <div className={cn(
                "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300",
                isScrolled && "opacity-100"
            )} />
            <div className=" px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/">
                    <Image src="/logo.png" className="mr-auto cursor-pointer" height={50} width={100} alt="logo" />
                </Link>
                {/* Navigation */}
                <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
                    {/* Products Dropdown */}
                    <div
                        className="relative group"
                        onMouseEnter={() => setIsProductsOpen(true)}
                        onMouseLeave={() => setIsProductsOpen(false)}
                    >
                        <button className={cn(
                            "relative flex items-center gap-1 text-sm font-medium text-black transition-all duration-200",
                            "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600 after:transition-all after:duration-300",
                            "hover:after:w-full",
                            isScrolled && "text-white"
                        )}>
                            Products
                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isProductsOpen && "rotate-180")} />
                        </button>

                        {/* Dropdown Menu */}
                        <div className={cn(
                            "absolute left-0 top-full pt-2 w-56 transition-all duration-300",
                            isProductsOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95 pointer-events-none"
                        )}>
                            <div className="bg-black/70 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden">
                                <Link
                                    href="/resume"
                                    className="relative block px-5 py-3.5 text-sm text-white/80 hover:text-white transition-all duration-200 group/item overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover/item:from-indigo-500/10 group-hover/item:via-purple-500/15 group-hover/item:to-indigo-500/10 transition-all duration-300" />
                                    <span className="relative">Resume AI</span>
                                </Link>
                                <Link
                                    href="/job-search"
                                    className="relative block px-5 py-3.5 text-sm text-white/80 hover:text-white transition-all duration-200 group/item overflow-hidden border-t border-white/5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover/item:from-indigo-500/10 group-hover/item:via-purple-500/15 group-hover/item:to-indigo-500/10 transition-all duration-300" />
                                    <span className="relative">Job Search</span>
                                </Link>
                                <Link
                                    href="/interview-ai"
                                    className="relative block px-5 py-3.5 text-sm text-white/80 hover:text-white transition-all duration-200 group/item overflow-hidden border-t border-white/5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover/item:from-indigo-500/10 group-hover/item:via-purple-500/15 group-hover/item:to-indigo-500/10 transition-all duration-300" />
                                    <span className="relative">Interview AI</span>
                                </Link>
                                <Link
                                    href="/recruiters/apply"
                                    className="relative block px-5 py-3.5 text-sm text-white/80 hover:text-white transition-all duration-200 group/item overflow-hidden border-t border-white/5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover/item:from-indigo-500/10 group-hover/item:via-purple-500/15 group-hover/item:to-indigo-500/10 transition-all duration-300" />
                                    <span className="relative">For Recruiters</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <Link
                        href="#testimonials"
                        onClick={(e) => scrollToSection(e, 'testimonials')}
                        className={cn(
                            "relative text-sm font-medium text-black transition-all duration-200",
                            "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600 after:transition-all after:duration-300",
                            "hover:after:w-full",
                            isScrolled && "text-white"
                        )}
                    >
                        Testimonials
                    </Link>
                    <Link
                        href="/pricing"
                        className={cn(
                            "relative text-sm font-medium text-black transition-all duration-200",
                            "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600 after:transition-all after:duration-300",
                            "hover:after:w-full",
                            isScrolled && "text-white"
                        )}
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/blog"
                        className={cn(
                            "relative text-sm font-medium text-black transition-all duration-200",
                            "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600 after:transition-all after:duration-300",
                            "hover:after:w-full",
                            isScrolled && "text-white"
                        )}
                    >
                        Blog
                    </Link>
                    <Link
                        href="#footer"
                        onClick={(e) => scrollToSection(e, 'footer')}
                        className={cn(
                            "relative text-sm font-medium text-black transition-all duration-200",
                            "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600 after:transition-all after:duration-300",
                            "hover:after:w-full",
                            isScrolled && "text-white"
                        )}
                    >
                        About Us
                    </Link>
                </nav>

                {/* Auth Buttons / Dashboard */}
                <div className="flex items-center ml-auto gap-4">
                    {session ? (
                        <Link
                            href="/dashboard"
                            className="relative px-6 py-2.5 rounded-full inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95 translate-y-0"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Go to Dashboard
                            </span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-sm" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/auth/sign-in"
                                className={cn(
                                    "relative text-sm font-medium text-black transition-all duration-200",
                                    "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600 after:transition-all after:duration-300",
                                    "hover:after:w-full",
                                    isScrolled && "text-white"
                                )}
                            >
                                Sign In
                            </Link>

                            <Link
                                href="/auth/sign-up"
                                className="relative px-5 py-2.5 rounded-full hidden md:inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95"
                            >
                                <span className="relative z-10">Get Started</span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-sm" />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header