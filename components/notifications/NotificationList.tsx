/**
 * NotificationList component
 * Displays a list of notifications with read/unread status and actions
 * Uses SSE state instead of TRPC polling
 */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { CheckCheck, Trash2 } from "lucide-react";
import { NotificationDialog } from "./NotificationDialog";
import { useNotificationState } from "@/hooks/useNotificationState";

type Notification = {
    id: string;
    title: string;
    content: string;
    sentAt: Date;
    isRead: boolean;
    readAt: Date | null;
};

export function NotificationList() {
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { latest: notifications, isLoading, markAsReadOptimistic, markAllAsReadOptimistic } = useNotificationState();

    // Keep mutations for actions (these don't poll, they're user-triggered)
    const markAsReadMutation = trpc.notifications.markAsRead.useMutation();

    const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();


    const handleNotificationClick = (notification: Notification) => {
        setSelectedNotification(notification);
        setDialogOpen(true);

        if (!notification.isRead) {
            markAsReadOptimistic(notification.id);
            markAsReadMutation.mutate({ announcementId: notification.id });
        }
    };

    const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        markAsReadOptimistic(notificationId);
        markAsReadMutation.mutate({ announcementId: notificationId });
    };


    const handleMarkAllAsRead = () => {
        markAllAsReadOptimistic();
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
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {hasUnread && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsReadMutation.isPending}
                    >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[400px]">
                <div className="divide-y">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "p-4 hover:bg-accent cursor-pointer transition-colors group relative",
                                !notification.isRead && "bg-accent/50"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium leading-none">
                                            {notification.title}
                                        </p>
                                        {!notification.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {notification.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.sentAt), {
                                            addSuffix: true,
                                        })}
                                    </p>
                                </div>

                                <div className="flex gap-1">
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                                            disabled={markAsReadMutation.isPending}
                                            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                            title="Mark as read"
                                        >
                                            <CheckCheck className="h-4 w-4" />
                                            <span className="sr-only">Mark as read</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <NotificationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                notification={selectedNotification}
            />
        </>
    );
}
