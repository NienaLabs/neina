/**
 * Support router for user-facing support ticket operations
 * Allows users to create tickets - admins manage everything else
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/prisma';

export const supportRouter = createTRPCRouter({
    /**
     * Create a new support ticket
     */
    createTicket: protectedProcedure
        .input(
            z.object({
                subject: z.string().min(1, "Subject is required"),
                category: z.string().default("general"),
                priority: z.string().default("medium"),
                message: z.string().min(1, "Message is required"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Create ticket with initial message
            const ticket = await prisma.supportTicket.create({
                data: {
                    userId,
                    subject: input.subject,
                    category: input.category,
                    priority: input.priority,
                    status: "open",
                    messages: {
                        create: {
                            sender: "user",
                            message: input.message,
                        },
                    },
                },
                include: {
                    messages: true,
                },
            });

            return ticket;
        }),
});
