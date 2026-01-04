/**
 * Component for managing push notification subscriptions
 * Displays permission status and allows users to subscribe/unsubscribe
 */

'use client';

import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationManager() {
    const {
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        canRequestPermission,
        isPermissionDenied,
    } = usePushNotifications();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BellRing className="h-5 w-5" />
                    <CardTitle>Push Notifications</CardTitle>
                </div>
                <CardDescription>
                    Get notified about new job matches and important updates
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Permission Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                        {permission === 'granted' ? (
                            <Bell className="h-4 w-4 text-green-600" />
                        ) : permission === 'denied' ? (
                            <BellOff className="h-4 w-4 text-red-600" />
                        ) : (
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">
                            {permission === 'granted' && 'Notifications Enabled'}
                            {permission === 'denied' && 'Notifications Blocked'}
                            {permission === 'default' && 'Notifications Not Configured'}
                        </span>
                    </div>
                    {isSubscribed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Active
                        </span>
                    )}
                </div>

                {/* Permission Denied Message */}
                {isPermissionDenied && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <p className="text-sm text-red-700 dark:text-red-400">
                            You've blocked notifications. To enable them, please update your browser settings.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        {canRequestPermission && (
                            <Button
                                onClick={subscribe}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                {isLoading ? 'Subscribing...' : 'Enable Notifications'}
                            </Button>
                        )}

                        {permission === 'granted' && !isSubscribed && (
                            <Button
                                onClick={subscribe}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                {isLoading ? 'Subscribing...' : 'Subscribe'}
                            </Button>
                        )}

                        {isSubscribed && (
                            <Button
                                onClick={unsubscribe}
                                disabled={isLoading}
                                variant="outline"
                                className="flex-1"
                            >
                                <BellOff className="h-4 w-4 mr-2" />
                                {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                            </Button>
                        )}
                    </div>

                    {permission === 'granted' && (
                        <Button
                            onClick={() => {
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.ready.then((reg) => {
                                        reg.showNotification('🧪 Test Notification', {
                                            body: 'If you see this, your browser and OS are correctly configured!',
                                            icon: '/logo.png',
                                            requireInteraction: true,
                                            tag: 'test-local',
                                        });
                                    });
                                } else {
                                    new Notification('🧪 Test Notification', {
                                        body: 'Standard notification fallback works!',
                                        icon: '/logo.png',
                                    });
                                }
                            }}
                            variant="ghost"
                            className="w-full text-xs text-muted-foreground hover:text-foreground"
                        >
                            Send Test Local Notification
                        </Button>
                    )}
                </div>

                {/* Info Text */}
                <p className="text-xs text-muted-foreground">
                    We'll notify you about job matches, interview reminders, and important updates.
                    You can unsubscribe at any time.
                </p>
            </CardContent>
        </Card>
    );
}
