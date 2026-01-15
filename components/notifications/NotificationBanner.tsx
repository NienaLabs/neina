"use client";

import { useState, useEffect } from "react";
import { X, Bell, ArrowRight } from "lucide-react";
import { useSession } from "@/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

/**
 * Notification banner component that prompts users to enable push notifications
 * Shows on /dashboard when user is not subscribed
 * Redirects to settings page for notification management
 */
export function NotificationBanner() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    const [isVisible, setIsVisible] = useState(true);
    const [isAppLoaded, setIsAppLoaded] = useState(false);

    // Check server subscription status (single source of truth)
    const { data: subStatus } = trpc.notifications.getSubscriptionStatus.useQuery(undefined, {
        enabled: !!session,
    });

    // Check dismissal and add delay
    useEffect(() => {
        const checkLoad = () => {
            if (document.readyState === "complete") {
                // Small buffer after "complete" to ensure UI has settled
                setTimeout(() => setIsAppLoaded(true), 500);
                return true;
            }
            return false;
        };

        if (!checkLoad()) {
            window.addEventListener("load", checkLoad);
        }

        const dismissedTime = localStorage.getItem("notification-banner-dismissed-time");

        if (dismissedTime) {
            const oneDay = 24 * 60 * 60 * 1000;
            const timeSinceDismissal = Date.now() - parseInt(dismissedTime);

            // If dismissed less than 24 hours ago, hide banner
            if (timeSinceDismissal < oneDay) {
                setIsVisible(false);
            } else {
                // Clear old dismissal
                localStorage.removeItem("notification-banner-dismissed-time");
            }
        }

        return () => window.removeEventListener("load", checkLoad);
    }, []);

    // Auto-hide when user becomes subscribed
    useEffect(() => {
        if (subStatus?.isSubscribed) {
            setIsVisible(false);
            // Clear any dismissal tracking since they're now subscribed
            localStorage.removeItem("notification-banner-dismissed-time");
        }
    }, [subStatus?.isSubscribed]);

    // Calculate final visibility
    const actuallyVisible = isVisible &&
        isAppLoaded &&
        !!session &&
        subStatus !== undefined &&
        !subStatus.isSubscribed &&
        (typeof window !== 'undefined' && window.Notification?.permission !== 'granted');

    // Update CSS variable for layout offset
    useEffect(() => {
        if (actuallyVisible) {
            const isMobile = window.innerWidth < 640;
            document.documentElement.style.setProperty("--banner-height", isMobile ? "52px" : "44px");
        } else {
            document.documentElement.style.setProperty("--banner-height", "0px");
        }
    }, [actuallyVisible]);

    const handleEnable = () => {
        // Navigate to account settings where user can manage notifications
        router.push('/account/settings');
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("notification-banner-dismissed-time", Date.now().toString());
    };

    return (
        actuallyVisible && (
            <>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    [data-slot="sidebar-container"] {
                        top: var(--banner-height, 0px) !important;
                        height: calc(100svh - var(--banner-height, 0px)) !important;
                        transition: top 0.2s ease-linear, height 0.2s ease-linear !important;
                    }
                    .sidebar-inset {
                        margin-top: var(--banner-height, 0px) !important;
                    }
                ` }} />
                <div className="sticky top-0 z-[100] bg-emerald-500">
                    <div className="mx-auto px-3 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between gap-3 py-2.5 sm:py-0 sm:h-[44px]">
                            {/* Desktop Layout */}
                            <div className="hidden sm:flex flex-1 items-center gap-x-4">
                                <p className="text-sm leading-6 text-white flex items-center gap-2">
                                    <Bell className="h-4 w-4 animate-bounce" />
                                    <strong className="font-bold">Never miss an update</strong>
                                    <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
                                        <circle cx={1} cy={1} r={1} />
                                    </svg>
                                    Enable push notifications to stay updated on job matches and announcements.
                                </p>
                                <button
                                    onClick={handleEnable}
                                    className="flex-none rounded-full bg-slate-900 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all duration-200"
                                >
                                    Enable Now <ArrowRight className="inline-block ml-1 h-3 w-3" />
                                </button>
                            </div>

                            {/* Mobile Layout */}
                            <div className="flex sm:hidden flex-1 items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                                    <Bell className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white leading-tight">
                                        Enable Notifications
                                    </p>
                                    <p className="text-[10px] text-emerald-50 leading-tight mt-0.5">
                                        Stay updated on job matches
                                    </p>
                                </div>
                                <button
                                    onClick={handleEnable}
                                    className="flex-shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-600 shadow-sm active:bg-emerald-50 transition-colors"
                                >
                                    Enable
                                </button>
                            </div>

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="flex-shrink-0 p-2 sm:p-3 text-white hover:text-emerald-100 transition-colors"
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    );
}
