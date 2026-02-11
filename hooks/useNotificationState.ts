"use client";

/**
 * Hook to manage notification state via SSE with Jotai for global state
 * Ensures Bell and List are always in sync
 */

import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { useServerEvents } from './useServerEvents';
import { useEffect } from 'react';

export interface Notification {
    id: string;
    title: string;
    content: string;
    sentAt: Date;
    isRead: boolean;
    readAt: Date | null;
}

// Global Atoms
export const notificationsAtom = atom<Notification[]>([]);
export const unreadCountAtom = atom<number>(0);
export const isLoadingAtom = atom<boolean>(true);

export function useNotificationState() {
    const [latest, setLatest] = useAtom(notificationsAtom);
    const [unreadCount, setUnreadCount] = useAtom(unreadCountAtom);
    const [isLoading, setIsLoading] = useAtom(isLoadingAtom);

    useServerEvents((event) => {
        if (event.type === 'INITIAL_STATE') {
            console.log('📊 [SSE] Received initial notification state');
            setUnreadCount(event.data.notifications.unreadCount);
            setLatest(event.data.notifications.latest);
            setIsLoading(false);
        }

        if (event.type === 'NEW_NOTIFICATION') {
            console.log('🔔 [SSE] New notification, updating state');
            setUnreadCount((prev) => event.data.unreadCount ?? (prev + 1));
            if (event.data.notification) {
                setLatest((prev) => [event.data.notification, ...prev].slice(0, 50));
            }
            setIsLoading(false);
        }

        if (event.type === 'NOTIFICATION_READ') {
            console.log('✅ [SSE] Notification marked as read');
            // Only decrement if we actually found an unread one locally
            let wasUnread = false;
            setLatest((prev) => prev.map(n => {
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

            // Remove from list
            setLatest((prev) => {
                const target = prev.find(n => n.id === event.data.notificationId);
                if (target && !target.isRead) wasUnread = true;
                return prev.filter(n => n.id !== event.data.notificationId);
            });

            // Decrement count ONLY if it was unread
            if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }

        if (event.type === 'ALL_NOTIFICATIONS_READ') {
            console.log('✅ [SSE] All notifications marked as read');
            setUnreadCount(0);
            setLatest((prev) => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
            setIsLoading(false);
        }
    });

    // Optimistic Actions
    const markAsReadOptimistic = (id: string) => {
        let wasUnread = false;
        setLatest((prev) => prev.map(n => {
            if (n.id === id) {
                if (!n.isRead) wasUnread = true;
                return { ...n, isRead: true, readAt: new Date() };
            }
            return n;
        }));
        if (wasUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    const deleteOptimistic = (id: string) => {
        let wasUnread = false;
        setLatest((prev) => {
            const target = prev.find(n => n.id === id);
            if (target && !target.isRead) wasUnread = true;
            return prev.filter(n => n.id !== id);
        });
        if (wasUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    const markAllAsReadOptimistic = () => {
        setUnreadCount(0);
        setLatest((prev) => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
    };

    return {
        unreadCount,
        latest,
        isLoading,
        markAsReadOptimistic,
        deleteOptimistic,
        markAllAsReadOptimistic
    };
}
