import { z } from 'zod';
import { createTRPCRouter, baseProcedure, type Context } from '../init';
import prisma from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { headers } from 'next/headers';

export const jobsRouter = createTRPCRouter({
    /**
     * Record a view for a job
     * Tracks unique views by user ID or IP address
     */
    recordView: baseProcedure
        .input(z.object({
            jobId: z.string(),
        }))
        .mutation(async ({ ctx, input }: { ctx: Context, input: { jobId: string } }) => {
            const h = await headers();
            const userId = ctx.session?.user?.id;
            const ipAddress = h.get('x-forwarded-for') || 'unknown';
            const userAgent = h.get('user-agent') || 'unknown';

            // Check if job exists
            const job = await prisma.jobs.findUnique({
                where: { id: input.jobId },
            });

            if (!job) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
            }

            // Check if already viewed by this user or IP
            const existingView = await prisma.jobView.findFirst({
                where: {
                    jobId: input.jobId,
                    OR: [
                        userId ? { userId } : { ipAddress },
                    ],
                },
            });

            if (!existingView) {
                // Determine recruiter ID if applicable (not strictly needed for creation but good for context if we kept it)
                // But now we just link to job.

                await prisma.$transaction([
                    prisma.jobView.create({
                        data: {
                            jobId: input.jobId,
                            userId,
                            ipAddress,
                            userAgent,
                        },
                    }),
                    prisma.jobs.update({
                        where: { id: input.jobId },
                        data: {
                            viewCount: { increment: 1 },
                        },
                    }),
                ]);

                return { success: true, viewed: true };
            }

            return { success: true, viewed: false };
        }),

    getJob: baseProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }: { input: { id: string } }) => {
            const job = await prisma.jobs.findUnique({
                where: { id: input.id },
                include: {
                    recruiterJob: {
                        select: {
                            id: true,
                            recruiterId: true,
                            postedAt: true,
                        }
                    }
                }
            });
            return job;
        }),
});
