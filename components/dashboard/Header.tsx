"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell as BellIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Settings as Cog6ToothIcon,
  User as UserCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Ensure the component is mounted before accessing browser APIs
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200 sticky top-0 z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-bold bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                JobAI
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="View notifications"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>

            

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Link href="/account/settings">
                <Cog6ToothIcon className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>

            {/* Pricing Link */}
            <div className="hidden sm:block">
              <Button asChild variant="ghost">
                <Link href="/Pricing" className="font-medium">
                  Pricing
                </Link>
              </Button>
            </div>

            {/* Profile */}
            <div className="relative ml-2">
              <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                <div className="h-8 w-8 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  <Link href="/account/settings">
                  <span>U</span>
                  </Link>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                  Profile
                </span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
