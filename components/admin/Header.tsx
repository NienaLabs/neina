"use client";

import Link from "next/link";
import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSession, signOut } from "@/auth-client";

export function Header() {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/80 backdrop-blur-md">
            <div className="flex h-20 items-center justify-between px-4 md:px-8">
                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-md">
                    <div className="relative w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="text"
                            placeholder="Search everything..."
                            className="w-full bg-secondary/50 border-transparent focus:border-primary/20 focus:bg-white pl-10 h-10 rounded-xl transition-all"
                        />
                    </div>
                </div>

                {/* Placeholder for mobile logo space */}
                <div className="flex items-center gap-4 lg:hidden ml-12">
                    <span className="font-syne font-bold text-lg">Job AI</span>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <NotificationBell />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 flex items-center gap-3 px-2 rounded-xl hover:bg-secondary">
                                <div className="hidden text-right lg:block">
                                    <p className="text-sm font-semibold text-foreground leading-none">
                                        {session?.user.name || "Admin User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-bold opacity-70">
                                        {(session?.user as any)?.role || "Admin"}
                                    </p>
                                </div>
                                <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                                    <AvatarImage src={session?.user.image || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {session?.user.name?.charAt(0) || "A"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl p-2" sideOffset={8}>
                            <DropdownMenuLabel className="font-syne font-bold px-3 py-2">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer gap-2">
                                <User className="h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer gap-2">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem
                                className="rounded-lg px-3 py-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/5 focus:text-destructive"
                                onClick={() => signOut()}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
