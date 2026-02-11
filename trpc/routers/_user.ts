import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/prisma";
import { broadcastEvent } from '@/lib/events';

export const userRouter = createTRPCRouter({
    getMe: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({
            where: { id: ctx.session.user.id },
        });
        return user;
    }),
    updateProfile: protectedProcedure
        .input(
            z.object({
                role: z.string().optional(),
                goal: z.string().optional(),
                referralSource: z.string().optional(),
                jobTitle: z.string().optional(),
                experienceLevel: z.string().optional(),
                selectedTopics: z.array(z.string()).optional(),
                location: z.string().optional(),
                jobType: z.string().optional(),
                remotePreference: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Extract role from input but don't save it
            // Recruiters will apply separately, job seekers stay as 'user'
            const { role, ...profileData } = input;

            return await prisma.user.update({
                where: { id: ctx.session.user.id },
                data: {
                    ...profileData,
                    onboardingCompleted: true,
                    // Role is NOT updated here - stays as default 'user'
                },
            });
        }),

    /**
     * Send message to admins (User to Admin messaging via push notifications)
     */
    sendAdminMessage: protectedProcedure
        .input(
            z.object({
                subject: z.string().min(1).max(100),
                message: z.string().min(1).max(1000),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            });

            if (!user) {
                throw new Error('User not found');
            }

            try {
                // 1. Always create a support ticket
                const ticket = await prisma.supportTicket.create({
                    data: {
                        userId,
                        subject: input.subject,
                        status: 'open',
                        messages: {
                            create: {
                                sender: 'user',
                                message: input.message,
                            },
                        },
                    },
                });

                // 2. Always create an in-app notification (announcement) for admins
                const announcement = await prisma.announcement.create({
                    data: {
                        title: `New Support Ticket: ${input.subject}`,
                        content: `From: ${user.name || user.email}\n\n${input.message.substring(0, 200)}...`,
                        type: 'in-app',
                        targetRoles: ['admin'],
                    }
                });

                // Emit SSE broadcast event (all admins are listening)
                broadcastEvent({
                    type: 'NEW_NOTIFICATION',
                    data: {
                        notification: {
                            id: announcement.id,
                            title: announcement.title,
                            content: announcement.content,
                            sentAt: announcement.sentAt,
                            isRead: false,
                            readAt: null,
                        }
                    }
                });

                // 3. Try to send push notifications to admins
                const admins = await prisma.user.findMany({
                    where: { role: 'admin' },
                    include: { pushSubscriptions: true },
                });

                const tokens = admins.flatMap((admin: any) =>
                    admin.pushSubscriptions?.map((sub: any) => sub.endpoint) || []
                );

                let pushResult = null;
                if (tokens.length > 0) {
                    const { sendMulticastPushNotification } = await import('@/lib/firebase-admin');
                    const notification = {
                        title: `📬 Support Ticket: ${input.subject}`,
                        body: `From ${user.name || user.email}`,
                        icon: '/niena.png',
                    };

                    const data = {
                        type: 'support_ticket',
                        url: '/admin/support',
                        ticketId: ticket.id,
                        userId,
                    };

                    pushResult = await sendMulticastPushNotification(tokens, notification, data);
                }

                return {
                    success: true,
                    message: pushResult ? 'Notified admins via push' : 'Ticket created and admins alerted in-app',
                    method: pushResult ? 'push' : 'in-app',
                    ticketId: ticket.id
                };
            } catch (error: any) {
                console.error('Error sending admin message:', error);
                throw new Error(error.message || 'Failed to send message to admins');
            }
        }),
});
