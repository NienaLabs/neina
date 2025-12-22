"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    PlusCircle,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Users,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const sidebarLinks = [
    {
        label: "Dashboard",
        href: "/recruiters/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "My Jobs",
        href: "/recruiters/jobs",
        icon: Briefcase,
    },
    {
        label: "Post a Job",
        href: "/recruiters/jobs/new",
        icon: PlusCircle,
    },
    // {
    //     label: "Analytics",
    //     href: "/recruiters/analytics",
    //     icon: BarChart3,
    // },
];

export function RecruiterSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <TooltipProvider>
            {/* Mobile Header & Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-slate-900 border-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link href="/recruiters/dashboard" className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-green-500/20 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-lg font-bold text-white">Recruiter</span>
                    </Link>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-slate-900 duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-64",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* SIDEBAR HEADER */}
                <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                    {!isCollapsed && (
                        <Link href="/recruiters/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-green-500" />
                            </div>
                            <span className="text-xl font-bold text-white">Recruiter</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <Link href="/recruiters/dashboard" className="flex items-center justify-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-green-500" />
                            </div>
                        </Link>
                    )}
                </div>

                <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                    <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
                        <div>
                            {!isCollapsed && (
                                <h3 className="mb-4 ml-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</h3>
                            )}

                            <ul className="mb-6 flex flex-col gap-1.5">
                                {sidebarLinks.map((link) => {
                                    const isActive = pathname === link.href || (link.href !== "/recruiters/dashboard" && pathname.startsWith(link.href));
                                    const Icon = link.icon;

                                    const LinkContent = (
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-800 hover:text-white",
                                                isActive && "bg-slate-800 text-white",
                                                isCollapsed && "justify-center"
                                            )}
                                        >
                                            <Icon className="h-5 w-5 flex-shrink-0" />
                                            {!isCollapsed && link.label}
                                        </Link>
                                    );

                                    return (
                                        <li key={link.href}>
                                            {isCollapsed ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                                                    <TooltipContent side="right">
                                                        <p>{link.label}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                LinkContent
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>
                </div>

                {/* Collapse Toggle Button */}
                <div className="mt-auto p-4 border-t border-slate-800 hidden lg:block">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "w-full text-slate-300 hover:bg-slate-800 hover:text-white",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-5 w-5" />
                        ) : (
                            <>
                                <ChevronLeft className="h-5 w-5 mr-2" />
                                Collapse
                            </>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
