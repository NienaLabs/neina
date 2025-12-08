/**
 * NotificationListener component
 * Polls for new notifications and displays toast notifications when new announcements arrive
 */
"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export function NotificationListener() {
    const lastCountRef = useRef<number | null>(null);

    // Poll for unread count every 30 seconds
    const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
        refetchInterval: 30000, // 30 seconds
    });

    useEffect(() => {
        // Skip the first render to avoid showing toast on initial load
        if (lastCountRef.current === null) {
            lastCountRef.current = unreadCount ?? 0;
            return;
        }

        // If count increased, show toast notification
        if (unreadCount !== undefined && unreadCount > lastCountRef.current) {
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
                            // The user can click the notification bell to view
                            document.querySelector('[data-notification-bell]')?.dispatchEvent(new Event('click'));
                        },
                    },
                }
            );
        }

        lastCountRef.current = unreadCount ?? 0;
    }, [unreadCount]);

    return null; // This component doesn't render anything
}
