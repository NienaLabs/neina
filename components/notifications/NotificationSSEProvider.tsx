"use client";

/**
 * NotificationSSEProvider
 * Single global provider that manages the SSE connection and syncs
 * notification + push-subscription state into Jotai atoms.
 * Events are handled once here; consumers just read atom state.
 */

import { useSetAtom } from 'jotai';
import { useServerEvents } from '@/hooks/useServerEvents';
import {
    notificationsAtom,
    unreadCountAtom,
    isLoadingAtom
} from '@/hooks/useNotificationState';
import {
    pushSubscribedAtom,
    pushCheckingStatusAtom
} from '@/hooks/usePushNotifications';

export function NotificationSSEProvider({ children }: { children: React.ReactNode }) {
    const setNotifications = useSetAtom(notificationsAtom);
    const setUnreadCount = useSetAtom(unreadCountAtom);
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setPushSubscribed = useSetAtom(pushSubscribedAtom);
    const setPushCheckingStatus = useSetAtom(pushCheckingStatusAtom);

    useServerEvents((event) => {
        if (event.type === 'INITIAL_STATE') {
            console.log('📊 [SSE] Received initial global state');

            // Notifications
            if (event.data.notifications) {
                setUnreadCount(event.data.notifications.unreadCount);
                setNotifications(event.data.notifications.latest);
                setIsLoading(false);
            }

            // Push Subscription
            if (event.data.pushSubscription) {
                setPushSubscribed(event.data.pushSubscription.isSubscribed);
                setPushCheckingStatus(false);
            }
        }

        if (event.type === 'NEW_NOTIFICATION') {
            console.log('🔔 [SSE] New notification, updating state');
            setUnreadCount((prev) => event.data.unreadCount ?? (prev + 1));
            if (event.data.notification) {
                setNotifications((prev) => [event.data.notification, ...prev].slice(0, 50));
            }
            setIsLoading(false);
        }

        if (event.type === 'NOTIFICATION_READ') {
            console.log('✅ [SSE] Notification marked as read');
            let wasUnread = false;
            setNotifications((prev) => prev.map(n => {
                if (n.id === event.data.notificationId) {
                    if (!n.isRead) wasUnread = true;
                    return { ...n, isRead: true, readAt: new Date() };
                }
                return n;
            }));

            if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }

        if (event.type === 'NOTIFICATION_DELETED') {
            console.log('🗑️ [SSE] Notification deleted');
            let wasUnread = false;

            setNotifications((prev) => {
                const target = prev.find(n => n.id === event.data.notificationId);
                if (target && !target.isRead) wasUnread = true;
                return prev.filter(n => n.id !== event.data.notificationId);
            });

            if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }

        if (event.type === 'ALL_NOTIFICATIONS_READ') {
            console.log('✅ [SSE] All notifications marked as read');
            setUnreadCount(0);
            setNotifications((prev) => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
            setIsLoading(false);
        }

        if (event.type === 'PUSH_SUBSCRIPTION_UPDATE') {
            console.log('🔄 [SSE] Push Subscription Update:', event.data);
            setPushSubscribed(event.data.isSubscribed);
            setPushCheckingStatus(false);
        }
    });

    return <>{children}</>;
}
