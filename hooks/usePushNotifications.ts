"use client";

/**
 * Custom hook for managing web push notifications
 * Handles permission requests, subscription, and foreground message listening
 */

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useServerEvents } from './useServerEvents';

export function usePushNotifications() {
    const router = useRouter();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const subscribeMutation = trpc.notifications.subscribeToPush.useMutation();
    const unsubscribeMutation = trpc.notifications.unsubscribeFromPush.useMutation();

    // Check current permission status
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Listen for SSE updates
    useServerEvents((event) => {
        if (event.type === 'INITIAL_STATE') {
            // Initialize subscription status from SSE initial state
            console.log('📊 [SSE] Initializing push subscription status');
            setIsSubscribed(event.data.pushSubscription.isSubscribed);
            setIsCheckingStatus(false);
        }

        if (event.type === 'PUSH_SUBSCRIPTION_UPDATE') {
            console.log('🔄 [SSE] Push Subscription Update:', event.data);
            setIsSubscribed(event.data.isSubscribed);
            setIsCheckingStatus(false);
        }
    });

    // Fallback: Stop checking status after 5 seconds if SSE doesn't respond
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isCheckingStatus) {
                console.warn('⚠️ SSE timeout - stopping status check');
                setIsCheckingStatus(false);
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [isCheckingStatus]);

    // Sync local state with server status (Removed TRPC query in favor of SSE)

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

            // 2. Show toast notification for foreground messages (UI feedback)
            // Skip toast for job alerts as per user request (they only want native notification for job alerts)
            // For job alerts, the service worker will handle the notification display
            if (payload.data?.type !== 'job_alert') {
                toast.info(title, {
                    description: body,
                    action: {
                        label: 'View',
                        onClick: () => {
                            // Find and click the notification bell to open popover
                            const bell = document.querySelector('[data-notification-bell]') as HTMLButtonElement;
                            if (bell) bell.click();
                        },
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
