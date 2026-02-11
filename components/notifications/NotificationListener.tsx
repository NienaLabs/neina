/**
 * NotificationListener component
 * Enables global push notification listening
 * Note: SSE connection and state management is handled by useNotificationState hook
 */
"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationListener() {
    // Enable global push notification listening
    usePushNotifications();

    // SSE connection and notification state is managed by useNotificationState hook
    // Components that need notification data should use useNotificationState directly

    return null; // This component doesn't render anything
}
