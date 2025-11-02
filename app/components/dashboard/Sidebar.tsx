"use client";

import {
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  MapIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  UserIcon,
  ChartBarIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", icon: HomeIcon, path: "/Dashboard", exact: true },
    { name: "Resume Builder", icon: DocumentTextIcon, path: "/ResumeBuilder" },
    { name: "Interview AI", icon: ChatBubbleLeftRightIcon, path: "/interview-ai" },
    { name: "Job Search", icon: BriefcaseIcon, path: "/job-search" },
    { name: "Career Roadmap", icon: MapIcon, path: "/roadmap" },
    { name: "Saved Jobs", icon: BookmarkIcon, path: "/saved-jobs" },
    { name: "Analytics", icon: ChartBarIcon, path: "/analytics" },
    { name: "Profile", icon: UserIcon, path: "/profile" },
    { name: "Settings", icon: Cog6ToothIcon, path: "/settings" },
  ];

  const isActive = (path: string, exact = false) =>
    exact ? pathname === path : pathname.startsWith(path);

  return (
    <div
      className={`relative flex flex-col h-screen bg-gray-800 dark:bg-gray-900 text-gray-200 ${
        isOpen ? "w-64" : "w-20"
      } transition-all duration-300 ease-in-out border-r border-gray-700`}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end h-16 border-b border-gray-700 pr-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          ) : (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-6 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-blue-600/20 text-white border-l-4 border-blue-500"
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${!isOpen ? "mx-auto" : ""}`} />
              {isOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      {isOpen && (
        <div className="w-full p-4 border-t border-gray-700 mt-auto">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              U
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">User Name</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
