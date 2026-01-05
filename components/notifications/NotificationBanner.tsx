"use client";

import { useState, useEffect } from "react";
import { X, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "@/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { requestNotificationPermission } from "@/lib/firebase";
import { toast } from "sonner";

export function NotificationBanner() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const utils = trpc.useUtils();

    const [isVisible, setIsVisible] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    // Check server subscription status
    const { data: subStatus } = trpc.notifications.getSubscriptionStatus.useQuery(undefined, {
        enabled: !!session,
    });

    const subscribeMutation = trpc.notifications.subscribeToPush.useMutation({
        onSuccess: () => {
            utils.notifications.getSubscriptionStatus.invalidate();
            router.refresh();
            toast.success("Notifications enabled!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to enable notifications");
        }
    });

    useEffect(() => {
        // Check if banner was dismissed in this session or recently
        const isDismissed = localStorage.getItem("notification-banner-dismissed");
        const dismissedTime = localStorage.getItem("notification-banner-dismissed-time");

        // If dismissed more than 24 hours ago, show it again
        const oneDay = 24 * 60 * 60 * 1000;
        const shouldResetDismissal = dismissedTime && (Date.now() - parseInt(dismissedTime) > oneDay);

        if (shouldResetDismissal) {
            localStorage.removeItem("notification-banner-dismissed");
            localStorage.removeItem("notification-banner-dismissed-time");
        }

        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);

            if (Notification.permission !== "granted" && !isDismissed) {
                setIsVisible(true);
            }
        }
    }, []);

    const actuallyVisible = isVisible &&
        !!session &&
        pathname === "/dashboard" &&
        !subStatus?.isSubscribed;

    useEffect(() => {
        if (actuallyVisible) {
            document.documentElement.style.setProperty("--banner-height", "44px");
        } else {
            document.documentElement.style.setProperty("--banner-height", "0px");
        }
    }, [actuallyVisible]);

    const handleEnable = async () => {
        try {
            const token = await requestNotificationPermission();
            if (token) {
                await subscribeMutation.mutateAsync({ token });
            } else {
                // If token is null, likely denied or closed
                if (Notification.permission === 'denied') {
                    toast.error("Notifications are blocked. Please enable them in your browser settings.");
                }
            }
        } catch (error) {
            console.error("Error enabling notifications:", error);
            toast.error("An error occurred while enabling notifications.");
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("notification-banner-dismissed", "true");
        localStorage.setItem("notification-banner-dismissed-time", Date.now().toString());
    };

    if (!actuallyVisible) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                [data-slot="sidebar-container"] {
                    top: var(--banner-height, 0px) !important;
                    height: calc(100svh - var(--banner-height, 0px)) !important;
                    transition: top 0.2s ease-linear, height 0.2s ease-linear !important;
                }
                /* Also adjust the main content if it's fixed or has top-0 */
                .sidebar-inset {
                    margin-top: var(--banner-height, 0px) !important;
                }
            ` }} />
            <div className="sticky top-0 z-[100] flex h-[44px] items-center gap-x-6 overflow-hidden bg-emerald-500 px-6 sm:px-3.5 sm:before:flex-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
                        disabled={subscribeMutation.isPending}
                        className="flex-none rounded-full bg-slate-900 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all duration-200 disabled:opacity-50"
                    >
                        {subscribeMutation.isPending ? "Configuring..." : "Enable Now"} <ArrowRight className="inline-block ml-1 h-3 w-3" />
                    </button>
                </div>
                <div className="flex flex-1 justify-end">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
                    >
                        <span className="sr-only">Dismiss</span>
                        <X className="h-5 w-5 text-white hover:text-emerald-100 transition-colors" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </>
    );
}
