/**
 * NotificationBell component
 * Displays a bell icon with unread count badge and opens a popover with notifications.
 * Refetches fresh notification data from the DB when the popover is opened,
 * ensuring data is always current even if SSE events were missed.
 */
"use client";

import { useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationList } from "./NotificationList";
import { useNotificationState } from "@/hooks/useNotificationState";
import { trpc } from "@/trpc/client";

export function NotificationBell() {
    const { unreadCount } = useNotificationState();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
    }, []);

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-notification-bell>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <NotificationList />
            </PopoverContent>
        </Popover>
    );
}

