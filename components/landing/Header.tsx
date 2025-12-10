"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useScroll } from "@/hooks/use-scroll"
import Image from 'next/image'
import { useSession, signOut } from '@/auth-client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, LogOut, Building2 } from 'lucide-react'

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

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/sign-in");
                    router.refresh();
                },
            },
        });
    };

    return (
        <header className={cn("w-full fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-transparent", isScrolled && "bg-black/80 backdrop-blur-md border-b border-white/10 shadow-lg")}>
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
                        <button className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors">
                            Products
                            <ChevronDown className={cn("w-4 h-4 transition-transform", isProductsOpen && "rotate-180")} />
                        </button>

                        {/* Dropdown Menu */}
                        <div className={cn(
                            "absolute left-0 mt-0 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-lg overflow-hidden transition-all opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                            isProductsOpen && "opacity-100 visible"
                        )}>
                            <Link
                                href="/resume"
                                className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Resume AI
                            </Link>
                            <Link
                                href="/job-search"
                                className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all border-t border-white/10"
                            >
                                Job Search
                            </Link>
                            <Link
                                href="/interview-ai"
                                className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all border-t border-white/10"
                            >
                                Interview AI
                            </Link>
                            <Link
                                href="/recruiters/apply"
                                className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all border-t border-white/10"
                            >
                                For Recruiters
                            </Link>
                        </div>
                    </div>



                    <Link
                        href="#testimonials"
                        onClick={(e) => scrollToSection(e, 'testimonials')}
                        className="nav-link"
                    >
                        Testimonials
                    </Link>
                    <Link
                        href="/pricing"
                        className="nav-link"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="#footer"
                        onClick={(e) => scrollToSection(e, 'footer')}
                        className="nav-link"
                    >
                        About Us
                    </Link>

                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center ml-auto gap-4">
                    {!session ? (
                        <>
                            <Link href="/auth/sign-in" className="hidden md:inline-block text-sm font-medium text-white/80 hover:text-white transition-colors">
                                Sign In
                            </Link>

                            <Link
                                href="/auth/sign-up"
                                className="px-4 py-2 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 inset-shadow-sm/70  transition-opacity"
                            >
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/10"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header