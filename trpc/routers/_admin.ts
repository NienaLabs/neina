import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import prisma from '@/lib/prisma';

export const adminRouter = createTRPCRouter({
    // --- User Management ---
    getUsers: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(20),
                cursor: z.string().nullish(),
                search: z.string().optional(),
                filter: z.enum(['all', 'active', 'suspended']).optional().default('all'),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            const limit = input.limit ?? 20;
            const { cursor, search, filter } = input;

            const where: any = {};

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (filter === 'suspended') {
                where.isSuspended = true;
            } else if (filter === 'active') {
                where.isSuspended = false;
            }

            const users = await prisma.user.findMany({
                take: limit + 1,
                where,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (users.length > limit) {
                const nextItem = users.pop();
                nextCursor = nextItem!.id;
            }

            return {
                users,
                nextCursor,
            };
        }),

    toggleUserSuspension: protectedProcedure
        .input(z.object({ userId: z.string(), isSuspended: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.user.update({
                where: { id: input.userId },
                data: { isSuspended: input.isSuspended }
            });
        }),

    updateUserPlan: protectedProcedure
        .input(z.object({ userId: z.string(), plan: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.user.update({
                where: { id: input.userId },
                data: { plan: input.plan }
            });
        }),

    // --- Support Tickets ---
    getSupportTickets: protectedProcedure
        .input(
            z.object({
                status: z.enum(['open', 'closed', 'in_progress']).optional(),
                limit: z.number().default(20),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            const tickets = await prisma.supportTicket.findMany({
                where: input.status ? { status: input.status } : undefined,
                take: input.limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, email: true, image: true } } }
            });

            return tickets;
        }),

    getTicketDetails: protectedProcedure
        .input(z.object({ ticketId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const ticket = await prisma.supportTicket.findUnique({
                where: { id: input.ticketId },
                include: {
                    messages: { orderBy: { createdAt: 'asc' } },
                    user: { select: { name: true, email: true } }
                }
            });
            return ticket;
        }),

    replyToTicket: protectedProcedure
        .input(z.object({ ticketId: z.string(), message: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.ticketMessage.create({
                data: {
                    ticketId: input.ticketId,
                    message: input.message,
                    sender: 'admin',
                }
            });
        }),

    // --- Job Management ---
    getJobs: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(20),
                cursor: z.string().nullish(),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            const limit = input.limit ?? 20;
            const { cursor, search } = input;

            const where: any = {};

            if (search) {
                where.OR = [
                    { job_title: { contains: search, mode: 'insensitive' } },
                    { employer_name: { contains: search, mode: 'insensitive' } },
                ];
            }

            const jobs = await prisma.jobs.findMany({
                take: limit + 1,
                where,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { created_at: 'desc' },
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (jobs.length > limit) {
                const nextItem = jobs.pop();
                nextCursor = nextItem!.id;
            }

            return {
                jobs,
                nextCursor,
            };
        }),

    deleteJob: protectedProcedure
        .input(z.object({ jobId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.jobs.delete({
                where: { id: input.jobId },
            });
        }),

    createJob: protectedProcedure
        .input(
            z.object({
                job_title: z.string(),
                employer_name: z.string(),
                job_location: z.string().optional(),
                job_description: z.string().optional(),
                job_apply_link: z.string().optional(),
                job_is_remote: z.boolean().optional(),
                qualifications: z.array(z.string()).optional(),
                responsibilities: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.jobs.create({
                data: {
                    ...input,
                    qualifications: input.qualifications || [],
                    responsibilities: input.responsibilities || [],
                },
            });
        }),

    // --- Category Management ---
    getCategories: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
        }

        return await prisma.job_categories.findMany({
            orderBy: { created_at: 'desc' },
        });
    }),

    createCategory: protectedProcedure
        .input(
            z.object({
                category: z.string(),
                location: z.string().optional(),
                active: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.job_categories.create({
                data: input,
            });
        }),

    updateCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                category: z.string().optional(),
                location: z.string().optional(),
                active: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            const { id, ...data } = input;
            return await prisma.job_categories.update({
                where: { id },
                data,
            });
        }),

    deleteCategory: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.job_categories.delete({
                where: { id: input.id },
            });
        }),

    // --- Job Sync Automation ---
    triggerJobSync: protectedProcedure.mutation(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

        const { inngest } = await import('@/inngest/client');

        // Trigger the daily job feed event
        await inngest.send({
            name: 'jobs/daily.feed',
            data: {},
        });

        return { success: true, message: 'Job sync triggered successfully' };
    }),

    // --- Analytics ---
    getAnalyticsOverview: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total counts
        const totalUsers = await prisma.user.count();
        const totalResumes = await prisma.resume.count();
        const totalInterviews = await prisma.interview.count();
        const totalJobs = await prisma.jobs.count();

        // Active users (users with sessions in last 30 days)
        const activeUsers = await prisma.session.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
        });

        // New users (last 7 days)
        const newUsers = await prisma.user.count({
            where: {
                createdAt: { gte: sevenDaysAgo },
            },
        });

        return {
            totalUsers,
            totalResumes,
            totalInterviews,
            totalJobs,
            activeUsers: activeUsers.length,
            newUsers,
        };
    }),

    getUserGrowth: protectedProcedure
        .input(z.object({ days: z.number().default(30) }))
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - input.days);

            // Get daily user registrations
            const usersByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
                SELECT DATE("createdAt") as date, COUNT(*)::int as count
                FROM "user"
                WHERE "createdAt" >= ${daysAgo}
                GROUP BY DATE("createdAt")
                ORDER BY date ASC
            `;

            return usersByDay.map(row => ({
                date: row.date.toISOString().split('T')[0],
                count: Number(row.count),
            }));
        }),

    getFeatureUsage: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Resumes created in last 30 days
        const resumesByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("createdAt") as date, COUNT(*)::int as count
            FROM "resume"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // Interviews in last 30 days
        const interviewsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("start_time") as date, COUNT(*)::int as count
            FROM "interview"
            WHERE "start_time" >= ${thirtyDaysAgo}
            GROUP BY DATE("start_time")
            ORDER BY date ASC
        `;

        // Tailored resumes in last 30 days
        const tailoredByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("createdAt") as date, COUNT(*)::int as count
            FROM "tailored_resume"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        return {
            resumes: resumesByDay.map(row => ({
                date: row.date.toISOString().split('T')[0],
                count: Number(row.count),
            })),
            interviews: interviewsByDay.map(row => ({
                date: row.date.toISOString().split('T')[0],
                count: Number(row.count),
            })),
            tailored: tailoredByDay.map(row => ({
                date: row.date.toISOString().split('T')[0],
                count: Number(row.count),
            })),
        };
    }),

    getJobStats: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Jobs added per day
        const jobsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("created_at") as date, COUNT(*)::int as count
            FROM "jobs"
            WHERE "created_at" >= ${thirtyDaysAgo}
            GROUP BY DATE("created_at")
            ORDER BY date ASC
        `;

        // Top job locations
        const topLocations = await prisma.$queryRaw<Array<{ location: string; count: bigint }>>`
            SELECT "job_location" as location, COUNT(*)::int as count
            FROM "jobs"
            WHERE "job_location" IS NOT NULL AND "job_location" != ''
            GROUP BY "job_location"
            ORDER BY count DESC
            LIMIT 10
        `;

        // Remote vs On-site
        const remoteStats = await prisma.jobs.groupBy({
            by: ['job_is_remote'],
            _count: true,
        });

        return {
            jobsByDay: jobsByDay.map(row => ({
                date: row.date.toISOString().split('T')[0],
                count: Number(row.count),
            })),
            topLocations: topLocations.map(row => ({
                location: row.location,
                count: Number(row.count),
            })),
            remoteStats: remoteStats.map(stat => ({
                type: stat.job_is_remote ? 'Remote' : 'On-site',
                count: stat._count,
            })),
        };
    }),

    // --- Announcements ---
    getAnnouncements: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
        }

        return await prisma.announcement.findMany({
            orderBy: { sentAt: 'desc' },
            take: 50,
        });
    }),

    createAnnouncement: protectedProcedure
        .input(
            z.object({
                title: z.string(),
                content: z.string(),
                type: z.enum(['in-app', 'email', 'both']).default('in-app'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            // Create announcement in database
            const announcement = await prisma.announcement.create({
                data: {
                    ...input,
                    createdBy: user.id,
                },
            });

            // Send email if type is 'email' or 'both'
            if (input.type === 'email' || input.type === 'both') {
                try {
                    // Get all user emails
                    const users = await prisma.user.findMany({
                        select: { email: true },
                    });

                    let emails = users.map(u => u.email).filter(Boolean);
                    emails = emails.filter(email => email === 'charlessmith35518@gmail.com');

                    if (emails.length > 0) {
                        const { sendAnnouncementEmail } = await import('@/lib/email');
                        await sendAnnouncementEmail(input.title, input.content, emails);
                        console.log(`✅ Email sent to ${emails.length} users:`, emails);
                    } else {
                        console.log('⚠️ No users found to send email to');
                    }
                } catch (emailError) {
                    console.error('❌ Failed to send announcement emails:', emailError);
                    // Don't fail the entire operation if email fails
                    // The announcement is still saved in the database
                }
            }

            return announcement;
        }),

    deleteAnnouncement: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.announcement.delete({
                where: { id: input.id },
            });
        }),

    // --- Sentry Error Monitoring ---
    getSentryIssues: protectedProcedure
        .input(z.object({ limit: z.number().default(25).optional() }))
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            try {
                const { getSentryIssues } = await import('@/lib/sentry-api');
                return await getSentryIssues(input.limit || 25);
            } catch (error) {
                console.error('Failed to fetch Sentry issues:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to fetch Sentry issues'
                });
            }
        }),

    getSentryStats: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            try {
                const { getSentryStats } = await import('@/lib/sentry-api');
                return await getSentryStats();
            } catch (error) {
                console.error('Failed to fetch Sentry stats:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to fetch Sentry stats'
                });
            }
        }),
});
