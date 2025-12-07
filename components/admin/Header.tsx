"use client";

import Link from "next/link";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="sticky top-0 z-40 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none p-4">
            <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                    {/* Hamburger Toggle Button would go here for mobile */}
                </div>

                <div className="hidden sm:block">
                    <form action="#" method="POST">
                        <div className="relative">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <input
                                type="text"
                                placeholder="Type to search..."
                                className="w-full bg-transparent pl-9 pr-4 text-black focus:outline-none dark:text-white xl:w-125"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        <li>
                            <Button variant="ghost" size="icon" className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white">
                                <Bell className="h-5 w-5 duration-300 ease-in-out" />
                                <span className="absolute -right-0.5 -top-0.5 z-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            </Button>
                        </li>
                    </ul>

                    {/* User Area */}
                    <div className="relative">
                        <Link className="flex items-center gap-4" href="#">
                            <span className="hidden text-right lg:block">
                                <span className="block text-sm font-medium text-black dark:text-white">Admin User</span>
                                <span className="block text-xs text-muted-foreground">Administrator</span>
                            </span>
                            <div className="h-10 w-10 text-muted-foreground bg-gray-100 rounded-full flex items-center justify-center">
                                <User />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
