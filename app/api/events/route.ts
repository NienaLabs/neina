import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { eventEmitter, SSEEvent } from '@/lib/events';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    let session = null;
    try {
        session = await auth.api.getSession({
            headers: req.headers
        });
    } catch (error) {
        console.error("❌ [SSE Route] Failed to get session:", error);
    }

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Helper to send events
            const sendEvent = (event: any) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                } catch (e) {
                    // Controller might be closed
                    console.error("SSE enqueue error:", e);
                }
            };

            // Fetch initial status and user data
            const [subCount, user] = await Promise.all([
                prisma.pushSubscription.count({ where: { userId } }),
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { createdAt: true },
                }),
            ]);

            const userRole = (session.user as any).role || 'user';

            // Fetch latest notifications
            const announcements = user ? await prisma.announcement.findMany({
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
                take: 20,
                include: {
                    announcement_read: {
                        where: { userId },
                        select: { readAt: true, isDeleted: true },
                    },
                },
            }) : [];

            // Calculate unread count (announcements sent after user join date that haven't been read)
            const userCreatedAt = user?.createdAt || new Date();
            const unreadCount = await prisma.announcement.count({
                where: {
                    type: { in: ['in-app', 'both'] },
                    sentAt: { gte: userCreatedAt },
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
                                { targetRoles: { has: userRole } },
                                { targetRoles: { equals: [] } },
                            ]
                        }
                    ]
                },
            });

            // Filter and transform notifications
            const latestNotifications = announcements
                .filter((a: any) => !a.announcement_read[0]?.isDeleted)
                .map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    content: a.content,
                    sentAt: a.sentAt,
                    isRead: a.announcement_read.length > 0 && !!a.announcement_read[0].readAt,
                    readAt: a.announcement_read[0]?.readAt || null,
                }));

            // Send comprehensive initial state
            sendEvent({
                type: 'INITIAL_STATE',
                data: {
                    pushSubscription: {
                        isSubscribed: subCount > 0,
                        deviceCount: subCount
                    },
                    notifications: {
                        unreadCount,
                        latest: latestNotifications
                    }
                }
            });

            const onEvent = (event: any) => {
                sendEvent(event);
            };

            const onBroadcast = (event: any) => {
                sendEvent(event);
            };

            // Listen for user-specific events
            eventEmitter.on(`user:${userId}`, onEvent);
            // Listen for global broadcast events
            eventEmitter.on('broadcast', onBroadcast);

            // Keep connection alive with periodic pings AND comments
            // Comments (":\n\n") are ignored by EventSource but keep the connection active
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: keep-alive\n\n`));
                    sendEvent({ type: 'PING', data: { timestamp: Date.now() } });
                } catch (e) {
                    clearInterval(pingInterval);
                }
            }, 15000);

            // Cleanup on disconnect
            req.signal.addEventListener('abort', () => {
                eventEmitter.off(`user:${userId}`, onEvent);
                eventEmitter.off('broadcast', onBroadcast);
                clearInterval(pingInterval);
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
