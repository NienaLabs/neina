/**
 * NotificationListener component
 * Polls for new notifications and displays toast notifications when new announcements arrive
 */
"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

const STORAGE_KEY = "notification_last_count";

export function NotificationListener() {
    const lastCountRef = useRef<number | null>(null);
    const isInitializedRef = useRef(false);

    // Poll for unread count every 60 seconds
    const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
        refetchInterval: 60000, // 60 seconds
    });

    useEffect(() => {
        // Initialize from localStorage on first render
        if (!isInitializedRef.current) {
            const stored = localStorage.getItem(STORAGE_KEY);
            lastCountRef.current = stored ? parseInt(stored, 10) : (unreadCount ?? 0);
            isInitializedRef.current = true;

            // Update localStorage with current count
            if (unreadCount !== undefined) {
                localStorage.setItem(STORAGE_KEY, unreadCount.toString());
            }
            return;
        }

        // If count increased, show toast notification
        if (unreadCount !== undefined && lastCountRef.current !== null && unreadCount > lastCountRef.current) {
            const newNotifications = unreadCount - lastCountRef.current;

            toast.info(
                newNotifications === 1
                    ? "You have a new notification"
                    : `You have ${newNotifications} new notifications`,
                {
                    duration: 5000,
                    position: "top-right",
                    action: {
                        label: "View",
                        onClick: () => {
                            // Programmatically click the bell to open the popover
                            const bell = document.querySelector('[data-notification-bell]') as HTMLElement;
                            bell?.click();
                        },
                    },
                }
            );
        }

        // Update both ref and localStorage
        if (unreadCount !== undefined) {
            lastCountRef.current = unreadCount;
            localStorage.setItem(STORAGE_KEY, unreadCount.toString());
        }
    }, [unreadCount]);

    return null; // This component doesn't render anything
}
