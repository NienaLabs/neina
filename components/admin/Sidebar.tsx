"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, MessageSquare, BarChart3, Megaphone, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const sidebarLinks = [
    {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: Users,
    },
    {
        label: "Jobs",
        href: "/admin/jobs",
        icon: Briefcase,
    },
    {
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
    },
    {
        label: "Support",
        href: "/admin/support",
        icon: MessageSquare,
    },
    {
        label: "Announcements",
        href: "/admin/announcements",
        icon: Megaphone,
    },
    {
        label: "Errors",
        href: "/admin/errors",
        icon: AlertCircle,
    },
    {
        label: "Recruiters",
        href: "/admin/recruiters",
        icon: Briefcase,
    },
    {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-slate-900 text-white"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-slate-900 transition-transform duration-300 ease-in-out dark:bg-boxdark",
                    "lg:static lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-72",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* SIDEBAR HEADER */}
                <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                    {!isCollapsed && (
                        <Link href="/admin" className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">Job AI Admin</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <Link href="/admin" className="flex items-center justify-center w-full">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                        </Link>
                    )}
                </div>
                {/* SIDEBAR HEADER */}

                <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                    {/* Sidebar Menu */}
                    <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
                        {/* Menu Group */}
                        <div>
                            {!isCollapsed && (
                                <h3 className="mb-4 ml-4 text-sm font-semibold text-slate-400">MENU</h3>
                            )}

                            <ul className="mb-6 flex flex-col gap-1.5">
                                {sidebarLinks.map((link) => {
                                    const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                                    const Icon = link.icon;

                                    return (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-800 hover:text-white",
                                                    isActive && "bg-slate-800 text-white",
                                                    isCollapsed && "justify-center"
                                                )}
                                                title={isCollapsed ? link.label : undefined}
                                            >
                                                <Icon className="h-5 w-5 flex-shrink-0" />
                                                {!isCollapsed && link.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>
                </div>

                {/* Collapse Toggle Button */}
                <div className="mt-auto p-4 border-t border-slate-800">
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
        </>
    );
}
