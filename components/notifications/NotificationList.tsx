/**
 * NotificationList component
 * Displays a list of notifications with read/unread status and actions
 */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import { NotificationDialog } from "./NotificationDialog";

type Notification = {
    id: string;
    title: string;
    content: string;
    sentAt: Date;
    isRead: boolean;
    readAt: Date | null;
};

export function NotificationList() {
    const utils = trpc.useUtils();
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data: notifications = [], isLoading } = trpc.notifications.getLatest.useQuery({
        limit: 20,
    });

    const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
        onSuccess: () => {
            // Invalidate queries to refresh the UI
            utils.notifications.getLatest.invalidate();
            utils.notifications.getUnreadCount.invalidate();
        },
    });

    const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
        onSuccess: () => {
            utils.notifications.getLatest.invalidate();
            utils.notifications.getUnreadCount.invalidate();
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            markAsReadMutation.mutate({ announcementId: notification.id });
        }
        // Open dialog to show full content
        setSelectedNotification(notification);
        setDialogOpen(true);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
        );
    }

    const hasUnread = notifications.some((n) => !n.isRead);

    return (
        <>
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={markAllAsReadMutation.isPending}
                            className="h-auto p-1 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <Separator />

                {/* Notifications List */}
                <ScrollArea className="h-[400px]">
                    <div className="flex flex-col">
                        {notifications.map((notification, index) => (
                            <div key={notification.id}>
                                <button
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "w-full text-left p-4 transition-colors hover:bg-muted/50",
                                        !notification.isRead && "bg-muted/30"
                                    )}
                                    disabled={markAsReadMutation.isPending}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Unread indicator */}
                                        <div className="mt-1.5">
                                            {!notification.isRead && (
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.content}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.sentAt), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                {index < notifications.length - 1 && <Separator />}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Notification Dialog */}
            <NotificationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                notification={selectedNotification}
            />
        </>
    );
}
