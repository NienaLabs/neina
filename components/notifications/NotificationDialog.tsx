/**
 * NotificationDialog component
 * Displays full notification content in a dialog when user clicks on a notification
 */
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

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
            </DialogContent>
        </Dialog>
    );
}
