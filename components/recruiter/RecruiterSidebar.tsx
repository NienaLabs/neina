"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    PlusCircle,
    Menu,
    LogOut,
    ChevronLeft,
    ChevronRight,
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
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/trpc/client";

const sidebarLinks = [
    {
        label: "Dashboard",
        href: "/recruiters/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Job Management",
        href: "/recruiters/jobs",
        icon: Briefcase,
    },
    {
        label: "Post a Job",
        href: "/recruiters/jobs/new",
        icon: PlusCircle,
    },
];

export function RecruiterSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: user } = trpc.user.getMe.useQuery();

    return (
        <TooltipProvider>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between border-b bg-background px-6 py-4">
                <Link href="/recruiters/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Briefcase className="h-4.5 w-4.5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight font-syne text-foreground">Neina</span>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-[70] lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            className="fixed left-0 top-0 bottom-0 w-[260px] bg-background z-[80] border-r lg:hidden flex flex-col p-6"
                        >
                            <div className="flex items-center gap-2 mb-10">
                                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                                    <Briefcase className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="text-2xl font-bold font-syne text-foreground">Neina</span>
                            </div>

                            <nav className="flex-1 space-y-1">
                                {sidebarLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4.5 w-4.5" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto border-t pt-4">
                                <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg text-muted-foreground">
                                    <LogOut className="h-4.5 w-4.5" /> Sign Out
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex h-screen flex-col border-r bg-background transition-all duration-300 sticky top-0 z-50",
                    isCollapsed ? "w-[72px]" : "w-[260px]"
                )}
            >
                {/* Logo Section */}
                <div className="p-6 h-[72px] flex items-center gap-3 border-b">
                    <div className="h-8 w-8 min-w-[32px] rounded-lg bg-primary flex items-center justify-center shadow-sm">
                        <Briefcase className="h-4.5 w-4.5 text-primary-foreground" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold tracking-tight font-syne text-foreground">
                            Neina
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-x-hidden overflow-y-auto no-scrollbar">
                    {sidebarLinks.map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/recruiters/dashboard" && pathname.startsWith(link.href));
                        const Icon = link.icon;

                        return (
                            <Link key={link.href} href={link.href}>
                                <div className={cn(
                                    "group flex items-center rounded-lg px-3 py-2 transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}>
                                    <Icon className={cn(
                                        "h-5 w-5 transition-transform duration-200",
                                        isActive ? "text-primary" : ""
                                    )} />

                                    {!isCollapsed && (
                                        <span className="ml-3 text-sm font-medium whitespace-nowrap">
                                            {link.label}
                                        </span>
                                    )}

                                    {isCollapsed && (
                                        <Tooltip>
                                            <TooltipTrigger className="absolute inset-0" />
                                            <TooltipContent side="right" className="font-semibold text-xs py-1.5 shadow-md">
                                                {link.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-3 border-t bg-muted/20">
                    <div className={cn(
                        "flex items-center gap-3 px-2 py-2 mb-3 rounded-lg",
                        isCollapsed ? "justify-center" : ""
                    )}>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] ring-1 ring-primary/20">
                            {user?.name?.charAt(0) || "R"}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-xs font-semibold truncate uppercase tracking-tighter">
                                    {user?.name || "Recruiter"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Recruiter</span>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "w-full h-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors px-0",
                            "justify-center"
                        )}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Collapse</span>
                                <ChevronLeft className="h-3 w-3" />
                            </div>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
