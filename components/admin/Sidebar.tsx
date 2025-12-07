"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, MessageSquare, BarChart3, Megaphone, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-slate-900 duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0">
            {/* SIDEBAR HEADER */}
            <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                <Link href="/admin" className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">Job AI Admin</span>
                </Link>
            </div>
            {/* SIDEBAR HEADER */}

            <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                {/* Sidebar Menu */}
                <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
                    {/* Menu Group */}
                    <div>
                        <h3 className="mb-4 ml-4 text-sm font-semibold text-slate-400">MENU</h3>

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
                                                isActive && "bg-slate-800 text-white"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>
            </div>
        </aside>
    );
}
