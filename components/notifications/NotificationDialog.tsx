/**
 * NotificationDialog component
 * Displays full notification content in a dialog when user clicks on a notification
 */
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useNotificationState } from "@/hooks/useNotificationState";
import { trpc } from "@/trpc/client";

interface NotificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    notification: {
        id: string;
        title: string;
        content: string;
        sentAt: Date;
        isRead: boolean;
    } | null;
}

export function NotificationDialog({ open, onOpenChange, notification }: NotificationDialogProps) {
    const { deleteOptimistic } = useNotificationState();
    const utils = trpc.useUtils();

    const deleteNotificationMutation = trpc.notifications.delete.useMutation({
        onSuccess: () => {
            onOpenChange(false);
            // Invalidate query to ensure consistency incase optimistic update failed or for other clients
            utils.notifications.getLatest.invalidate();
            utils.notifications.getUnreadCount.invalidate();
        },
    });

    const handleDelete = () => {
        if (!notification) return;

        // 1. Optimistic update (instant UI change)
        deleteOptimistic(notification.id);

        // 2. Close dialog immediately
        onOpenChange(false);

        // 3. Server mutation
        deleteNotificationMutation.mutate({ announcementId: notification.id });
    };

    if (!notification) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{notification.title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {notification.content}
                    </p>
                </div>
                <DialogFooter className="mt-6 flex sm:justify-between items-center w-full">
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteNotificationMutation.isPending}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
