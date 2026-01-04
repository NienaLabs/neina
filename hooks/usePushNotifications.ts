/**
 * Custom hook for managing web push notifications
 * Handles permission requests, subscription, and foreground message listening
 */

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function usePushNotifications() {
    const router = useRouter();
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

    // Check server-side subscription status
    const { data: subscriptionStatus, isLoading: isCheckingStatus } = trpc.notifications.getSubscriptionStatus.useQuery(
        undefined,
        {
            enabled: typeof window !== 'undefined' && permission === 'granted',
            retry: false,
        }
    );

    // Sync local state with server status
    useEffect(() => {
        if (subscriptionStatus) {
            setIsSubscribed(subscriptionStatus.isSubscribed);
        }
    }, [subscriptionStatus]);

    // Listen for foreground messages
    useEffect(() => {
        if (permission !== 'granted') return;

        const unsubscribePromise = onMessageListener((payload) => {
            console.log('Foreground message received:', payload);

            const title = payload.notification?.title || 'New Notification';
            const body = payload.notification?.body || '';
            const icon = payload.notification?.icon || '/logo.png';
            const url = payload.data?.url || '/';

            // 1. Play "ding" sound
            const playNotificationSound = async () => {
                try {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Higher pitch
                    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.3); // Drop pitch

                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.3);
                } catch (e) {
                    console.error('Error playing notification sound:', e);
                }
            };

            playNotificationSound();

            // 2. Show native browser notification immediately (Direct API)
            console.log('🔔 [usePushNotifications] Permission Status:', Notification.permission);
            if (Notification.permission === 'granted') {
                try {
                    console.log('🔍 [usePushNotifications] Attempting Window Notification...');
                    const n = new Notification(title, {
                        body,
                        icon: '/niena.png',
                        tag: 'job-alert',
                        renotify: true,
                        silent: true,
                        requireInteraction: true
                    } as any);

                    console.log('✅ [usePushNotifications] Window Notification object created');

                    n.onclick = (e) => {
                        e.preventDefault();
                        window.focus();
                        router.push(url);
                        n.close();
                    };
                } catch (err) {
                    console.warn('⚠️ [usePushNotifications] Window Notification failed, trying SW...', err);
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then((reg) => {
                            reg.showNotification(title, { body, tag: 'job-alert', silent: true });
                        });
                    }
                }
            } else {
                console.warn('❌ [usePushNotifications] Notification blocked by settings');
                toast.error("Notifications are blocked in your browser.");
            }

            // 3. Show toast notification for foreground messages (UI feedback)
            // Skip toast for job alerts as per user request (they only want native notification for job alerts)
            if (payload.data?.type !== 'job_alert') {
                toast.info(title, {
                    description: body,
                    action: {
                        label: 'View',
                        onClick: () => router.push(url),
                    },
                });
            }
        });

        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe && typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            }).catch(err => console.error('Error in message listener cleanup:', err));
        };
    }, [permission, router]);

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
        isLoading: isLoading || isCheckingStatus,
        subscribe,
        unsubscribe,
        canRequestPermission: permission === 'default',
        isPermissionDenied: permission === 'denied',
    };
}
