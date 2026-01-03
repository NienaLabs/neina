/**
 * Notifications router for handling in-app notifications
 * Provides endpoints for fetching, marking as read, and managing user notifications
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/prisma';

export const notificationsRouter = createTRPCRouter({
    /**
     * Get latest announcements for the current user
     * Returns announcements with read status
     */
    getLatest: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get user role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            const userRole = user?.role || 'user';

            // Fetch announcements with read status and targeting logic
            const announcements = await prisma.announcement.findMany({
                where: {
                    type: { in: ['in-app', 'both'] },
                    AND: [
                        {
                            OR: [
                                { targetUserIds: { has: userId } },
                                { targetUserIds: { equals: [] } },
                            ]
                        },
                        {
                            OR: [
                                { targetRoles: { has: userRole } },
                                { targetRoles: { equals: [] } },
                            ]
                        }
                    ]
                },
                orderBy: { sentAt: 'desc' },
                take: input.limit,
                include: {
                    announcement_read: {
                        where: { userId },
                        select: { readAt: true, isDeleted: true },
                    },
                },
            });

            // Filter out deleted announcements
            const activeAnnouncements = announcements.filter(a => {
                const readRecord = a.announcement_read[0];
                return !readRecord?.isDeleted;
            });

            // Transform to include isRead flag
            return activeAnnouncements.map(announcement => ({
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                sentAt: announcement.sentAt,
                isRead: announcement.announcement_read.length > 0 && !!announcement.announcement_read[0].readAt,
                readAt: announcement.announcement_read[0]?.readAt || null,
            }));
        }),

    /**
     * Get count of unread announcements for the current user
     */
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Get user creation date and role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true, role: true },
        });

        if (!user) return 0;

        // Count announcements that:
        // 1. Are in-app or both
        // 2. Were sent after user creation
        // 3. Haven't been read by this user
        // 4. Match targeting criteria
        const unreadCount = await prisma.announcement.count({
            where: {
                type: { in: ['in-app', 'both'] },
                sentAt: { gte: user.createdAt },
                announcement_read: {
                    none: { userId },
                },
                AND: [
                    {
                        OR: [
                            { targetUserIds: { has: userId } },
                            { targetUserIds: { equals: [] } },
                        ]
                    },
                    {
                        OR: [
                            { targetRoles: { has: user.role } },
                            { targetRoles: { equals: [] } },
                        ]
                    }
                ]
            },
        });

        return unreadCount;
    }),

    /**
     * Mark a specific announcement as read
     */
    markAsRead: protectedProcedure
        .input(z.object({ announcementId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Use upsert to handle duplicate attempts gracefully
            await prisma.announcement_read.upsert({
                where: {
                    userId_announcementId: {
                        userId,
                        announcementId: input.announcementId,
                    },
                },
                create: {
                    userId,
                    announcementId: input.announcementId,
                },
                update: {
                    // Update readAt to current time if already exists
                    readAt: new Date(),
                },
            });

            return { success: true };
        }),

    /**
     * Delete a notification (mark as deleted)
     */
    delete: protectedProcedure
        .input(z.object({ announcementId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            await prisma.announcement_read.upsert({
                where: {
                    userId_announcementId: {
                        userId,
                        announcementId: input.announcementId,
                    },
                },
                create: {
                    userId,
                    announcementId: input.announcementId,
                    isDeleted: true,
                    readAt: new Date(), // If they delete it, it's considered read
                },
                update: {
                    isDeleted: true,
                },
            });

            return { success: true };
        }),

    /**
     * Mark all current announcements as read for the user
     */
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Get all in-app announcements
        const announcements = await prisma.announcement.findMany({
            where: {
                type: { in: ['in-app', 'both'] },
            },
            select: { id: true },
        });

        // Create read records for all announcements
        // Use createMany with skipDuplicates to avoid conflicts
        await prisma.announcement_read.createMany({
            data: announcements.map(a => ({
                userId,
                announcementId: a.id,
            })),
            skipDuplicates: true,
        });

        return { success: true, count: announcements.length };
    }),

    /**
     * Subscribe user to push notifications
     */
    subscribeToPush: protectedProcedure
        .input(
            z.object({
                token: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            try {
                // Check if subscription already exists
                const existing = await prisma.pushSubscription.findFirst({
                    where: {
                        userId,
                        endpoint: input.token,
                    },
                });

                if (existing) {
                    return { success: true, message: 'Already subscribed' };
                }

                // Create new subscription
                await prisma.pushSubscription.create({
                    data: {
                        userId,
                        endpoint: input.token,
                        keys: {}, // FCM tokens don't need additional keys
                    },
                });

                return { success: true, message: 'Successfully subscribed to push notifications' };
            } catch (error: any) {
                console.error('Error subscribing to push:', error);
                throw new Error('Failed to subscribe to push notifications');
            }
        }),

    /**
     * Unsubscribe user from push notifications
     */
    unsubscribeFromPush: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        try {
            await prisma.pushSubscription.deleteMany({
                where: {
                    userId,
                },
            });

            return { success: true, message: 'Successfully unsubscribed from push notifications' };
        } catch (error: any) {
            console.error('Error unsubscribing from push:', error);
            throw new Error('Failed to unsubscribe from push notifications');
        }
    }),

    /**
     * Get user's subscription status
     */
    getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const count = await prisma.pushSubscription.count({
            where: {
                userId,
            },
        });

        return {
            isSubscribed: count > 0,
            deviceCount: count,
        };
    }),
});
