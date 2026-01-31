/**
 * NotificationListener component
 * Polls for new notifications and handles global push notification listening
 */
"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const STORAGE_KEY = "notification_last_count";

export function NotificationListener() {
    // Enable global push notification listening
    usePushNotifications();

    const lastCountRef = useRef<number | null>(null);
    const isInitializedRef = useRef(false);

    // Get unread count on page load
    const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();

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

            // If we have push notifications enabled, we might not want to double-toast,
            // but the polling is a fallback for when push fails or for non-push alerts.
            // For now, keeping both is safer.

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
