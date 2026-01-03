/**
 * Custom hook for managing web push notifications
 * Handles permission requests, subscription, and foreground message listening
 */

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const subscribeMutation = trpc.notifications.subscribeToPush.useMutation();
    const unsubscribeMutation = trpc.notifications.unsubscribeFromPush.useMutation();

    // Check current permission status
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Listen for foreground messages
    useEffect(() => {
        if (permission !== 'granted') return;

        const unsubscribePromise = onMessageListener((payload) => {
            console.log('Foreground message received:', payload);

            // Show toast notification for foreground messages
            toast.info(payload.notification?.title || 'New Notification', {
                description: payload.notification?.body,
                action: payload.data?.url ? {
                    label: 'View',
                    onClick: () => window.location.href = payload.data.url,
                } : undefined,
            });
        });

        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe && typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            }).catch(err => console.error('Error in message listener cleanup:', err));
        };
    }, [permission]);

    /**
     * Request notification permission and subscribe to push notifications
     */
    const subscribe = useCallback(async () => {
        setIsLoading(true);

        try {
            // Request permission and get FCM token
            const token = await requestNotificationPermission();

            if (!token) {
                if (Notification.permission === 'denied') {
                    toast.error('Permission denied. Please enable notifications in your browser settings.');
                } else {
                    toast.error('Failed to get notification permission. Please try again.');
                }
                setIsLoading(false);
                return false;
            }

            // Save subscription to backend
            await subscribeMutation.mutateAsync({ token });

            setPermission('granted');
            setIsSubscribed(true);
            toast.success('Successfully subscribed to notifications!');

            return true;
        } catch (error: any) {
            console.error('Error subscribing to push notifications:', error);

            if (error.code === 'messaging/permission-blocked' || error.message?.includes('permission-blocked')) {
                toast.error('Notifications are blocked. Please enable them in your browser settings.');
            } else if (error.code === 'messaging/unsupported-browser') {
                toast.error('Your browser does not support push notifications.');
            } else if (error.message?.includes('Missing required')) {
                toast.error('Configuration error: Missing Firebase credentials.');
            } else {
                toast.error(error.message || 'Failed to subscribe to notifications');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [subscribeMutation]);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async () => {
        setIsLoading(true);

        try {
            await unsubscribeMutation.mutateAsync();

            setIsSubscribed(false);
            toast.success('Successfully unsubscribed from notifications');

            return true;
        } catch (error: any) {
            console.error('Error unsubscribing from push notifications:', error);
            toast.error(error.message || 'Failed to unsubscribe');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [unsubscribeMutation]);

    return {
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        canRequestPermission: permission === 'default',
        isPermissionDenied: permission === 'denied',
    };
}
