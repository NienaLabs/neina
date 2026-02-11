"use client";

/**
 * Hook to manage notification state via Jotai atoms
 * Provides optimistic update helpers and a syncFromQuery method
 * for refreshing atom state from TRPC query results.
 * Ensures Bell and List are always in sync.
 */

import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { useCallback } from 'react';

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

    /**
     * Sync atom state from TRPC query results (used by NotificationBell on popover open).
     * Replaces atom contents with fresh data from the database.
     */
    const syncFromQuery = useCallback((notifications: Notification[], unread?: number) => {
        setLatest(notifications);
        if (typeof unread === 'number') {
            setUnreadCount(unread);
        }
        setIsLoading(false);
    }, [setLatest, setUnreadCount, setIsLoading]);

    return {
        unreadCount,
        latest,
        isLoading,
        markAsReadOptimistic,
        deleteOptimistic,
        markAllAsReadOptimistic,
        syncFromQuery
    };
}

