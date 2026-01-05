"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    MessageSquare,
    BarChart3,
    Megaphone,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    FileText,
    Menu,
    X,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/auth-client";

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
        label: "Blog",
        href: "/admin/blog",
        icon: FileText,
    },
    {
        label: "Recruiters",
        href: "/admin/recruiters",
        icon: Briefcase,
    },
    {
        label: "Errors",
        href: "/admin/errors",
        icon: AlertCircle,
    },
    {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Menu Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-[60]">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="bg-white/80 backdrop-blur-md border-border shadow-sm"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 z-[56] flex h-screen flex-col border-r border-border bg-white transition-all duration-300 ease-in-out",
                    "lg:sticky lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-72",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Section */}
                <div className="flex h-20 items-center px-6 border-b border-border/50">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Users className="h-6 w-6" />
                        </div>
                        {!isCollapsed && (
                            <span className="text-xl font-bold font-syne tracking-tight text-foreground whitespace-nowrap">
                                Job AI Admin
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
                    <nav className="space-y-1">
                        {!isCollapsed && (
                            <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
                                Main Menu
                            </p>
                        )}
                        {sidebarLinks.map((link) => {
                            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                        isCollapsed && "justify-center px-0"
                                    )}
                                    title={isCollapsed ? link.label : undefined}
                                >
                                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-inherit" : "text-muted-foreground group-hover:text-foreground")} />
                                    {!isCollapsed && (
                                        <span className="transition-opacity duration-200">{link.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t border-border/50 space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "hidden lg:flex w-full text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl",
                            isCollapsed && "justify-center"
                        )}
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
                            <>
                                <ChevronLeft className="h-5 w-5 mr-2" />
                                <span>Collapse Sidebar</span>
                            </>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                        className={cn(
                            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </Button>
                </div>
            </aside>
        </>
    );
}
