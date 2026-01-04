import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/prisma";

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
                message: z.string().min(1).max(500),
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
                // Get all admin users with push subscriptions
                // @ts-ignore - Types might not be fully synced yet
                const admins = await prisma.user.findMany({
                    where: { role: 'admin' },
                    include: { pushSubscriptions: true },
                });

                if (admins.length === 0) {
                    throw new Error('No admins found');
                }

                // Collect all admin tokens
                const tokens = admins.flatMap((admin: any) =>
                    // @ts-ignore
                    admin.pushSubscriptions?.map((sub: any) => sub.endpoint) || []
                );

                if (tokens.length === 0) {
                    // Fallback: create support ticket if no push subscriptions
                    await prisma.supportTicket.create({
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

                    return {
                        success: true,
                        message: 'Support ticket created. Admins will respond soon.',
                        method: 'ticket',
                    };
                }

                // Send push notifications to admins
                const { sendMulticastPushNotification } = await import('@/lib/firebase-admin');

                const notification = {
                    title: `📬 Message from ${user.name || user.email}`,
                    body: `${input.subject}: ${input.message.substring(0, 100)}${input.message.length > 100 ? '...' : ''}`,
                    icon: '/logo.png',
                };

                const data = {
                    type: 'user_message',
                    url: '/admin/messages',
                    userId,
                    subject: input.subject,
                };

                const result = await sendMulticastPushNotification(tokens, notification, data);

                return {
                    success: true,
                    message: `Message sent to ${result.successCount} admin devices`,
                    sentCount: result.successCount,
                    method: 'push',
                };
            } catch (error: any) {
                console.error('Error sending admin message:', error);
                throw new Error(error.message || 'Failed to send message to admins');
            }
        }),
});
