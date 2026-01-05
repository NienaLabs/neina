import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import prisma from '@/lib/prisma';
import { sendRecruiterApprovalEmail, sendRecruiterRejectionEmail } from '@/lib/email';
import { sendPushNotification, sendMulticastPushNotification } from '@/lib/firebase-admin';

export const adminRouter = createTRPCRouter({
    // --- User Management ---
    getUsers: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(10),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
                filter: z.enum(['all', 'active', 'suspended']).optional().default('all'),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            const { limit, page, search, filter } = input;
            const skip = (page - 1) * limit;

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

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    take: limit,
                    skip,
                    where,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count({ where }),
            ]);

            return {
                users,
                total,
                totalPages: Math.ceil(total / limit),
            };
        }),

    toggleUserSuspension: protectedProcedure
        .input(z.object({ userId: z.string(), isSuspended: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            const updatedUser = await prisma.user.update({
                where: { id: input.userId },
                data: { isSuspended: input.isSuspended }
            });

            if (input.isSuspended) {
                // Revoke all sessions directly from DB
                await prisma.session.deleteMany({
                    where: { userId: input.userId }
                });
            }

            return updatedUser;
        }),

    updateUserPlan: protectedProcedure
        .input(z.object({ userId: z.string(), plan: z.enum(['FREE', 'SILVER', 'GOLD', 'DIAMOND']) }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.user.update({
                where: { id: input.userId },
                data: { plan: input.plan }
            });
        }),
    updateUserRole: protectedProcedure
        .input(z.object({ userId: z.string(), role: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.user.update({
                where: { id: input.userId },
                data: { role: input.role }
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

            // 1. Create the message
            const message = await prisma.ticketMessage.create({
                data: {
                    ticketId: input.ticketId,
                    message: input.message,
                    sender: 'admin',
                }
            });

            // 2. Auto-close the ticket and fetch details
            const ticket = await prisma.supportTicket.update({
                where: { id: input.ticketId },
                data: { status: 'closed' },
                include: { user: { select: { email: true } } }
            });

            // 3. Send email notification (fire and forget)
            if (ticket?.user?.email) {
                const { sendSupportReplyEmail } = await import('@/lib/email');
                // We don't await this so the UI response isn't delayed
                sendSupportReplyEmail(
                    ticket.user.email,
                    ticket.subject,
                    input.message,
                    ticket.id
                ).then(result => {
                    if (result.success) {
                        console.log(`✅ Support reply email sent to ${ticket.user.email}`);
                    } else {
                        console.error('❌ Failed to send support reply email:', result.error);
                    }
                });
            }

            return message;
        }),

    updateTicketStatus: protectedProcedure
        .input(z.object({
            ticketId: z.string(),
            status: z.enum(['open', 'in_progress', 'closed'])
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.supportTicket.update({
                where: { id: input.ticketId },
                data: { status: input.status }
            });
        }),

    closeTicket: protectedProcedure
        .input(z.object({ ticketId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            return await prisma.supportTicket.update({
                where: { id: input.ticketId },
                data: { status: 'closed' }
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
                targetUserIds: z.array(z.string()).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            // Create announcement in database
            const announcement = await prisma.announcement.create({
                data: {
                    title: input.title,
                    content: input.content,
                    type: input.type,
                    targetUserIds: input.targetUserIds,
                    createdBy: user.id,
                },
            });

            // Send email if type is 'email' or 'both'
            if (input.type === 'email' || input.type === 'both') {
                try {
                    // Get user emails based on targeting
                    const where: any = {};

                    // If targetUserIds is present and not empty, filter by IDs
                    if (input.targetUserIds && input.targetUserIds.length > 0) {
                        where.id = { in: input.targetUserIds };
                    }

                    // If targetRoles is supported in the future, add it here

                    const users = await prisma.user.findMany({
                        where,
                        select: { email: true },
                    });

                    const emails = users.map(u => u.email).filter(Boolean);

                    if (emails.length > 0) {
                        const { sendAnnouncementEmail } = await import('@/lib/email');
                        // Batch send or send efficiently - for now simple loop or bulk send if provider supports
                        // Resend supports array of 'to' addresses
                        await sendAnnouncementEmail(input.title, input.content, emails);
                        console.log(`✅ Email sent to ${emails.length} users`);
                    } else {
                        console.log('⚠️ No users found to send email to');
                    }
                } catch (emailError) {
                    console.error('❌ Failed to send announcement emails:', emailError);
                    // Don't fail the entire operation if email fails
                }
            }

            // Send Push Notification if type is 'in-app' or 'both'
            if (input.type === 'in-app' || input.type === 'both') {
                try {
                    const where: any = {};
                    if (input.targetUserIds && input.targetUserIds.length > 0) {
                        where.userId = { in: input.targetUserIds };
                    }

                    // Fetch all valid subscriptions with user names
                    const subscriptions = await prisma.pushSubscription.findMany({
                        where,
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    });

                    if (subscriptions.length > 0) {
                        const { sendPushNotification } = await import('@/lib/firebase-admin');

                        let successCount = 0;
                        for (const sub of subscriptions) {
                            try {
                                const userName = (sub as any).user?.name || 'there';
                                const personalizedBody = `Hey ${userName.split(' ')[0]}, ${input.content}`;

                                const result = await sendPushNotification(
                                    sub.endpoint,
                                    {
                                        title: input.title,
                                        body: personalizedBody,
                                        icon: '/niena.png',
                                    },
                                    {
                                        url: '/dashboard',
                                        type: 'announcement',
                                        tag: 'announcement',
                                    }
                                );
                                if (result.success) successCount++;
                            } catch (err) {
                                console.error(`Error sending push to ${sub.endpoint}:`, err);
                            }
                        }
                        console.log(`✅ Personalized push sent to ${successCount} devices`);
                    }
                } catch (pushError) {
                    console.error('❌ Failed to send announcement push:', pushError);
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

    // --- Recruiter Management ---
    getRecruiterApplications: protectedProcedure
        .input(
            z.object({
                status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
                limit: z.number().default(20),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
            }

            return await prisma.recruiterApplication.findMany({
                where: input.status ? { status: input.status } : undefined,
                take: input.limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            });
        }),

    approveRecruiterApplication: protectedProcedure
        .input(z.object({ applicationId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            const application = await prisma.recruiterApplication.findUnique({
                where: { id: input.applicationId },
            });

            if (!application) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
            }

            // Update application status
            await prisma.recruiterApplication.update({
                where: { id: input.applicationId },
                data: {
                    status: 'APPROVED',
                    reviewedBy: user.id,
                    reviewedAt: new Date(),
                },
            });

            // Update user role to recruiter
            await prisma.user.update({
                where: { id: application.userId },
                data: { role: 'recruiter' },
            });

            // Send in-app notification
            await prisma.announcement.create({
                data: {
                    title: 'Recruiter Application Approved',
                    content: 'Congratulations! Your application to become a recruiter has been approved. You can now post jobs and manage candidates 🎉.',
                    type: 'in-app',
                    targetUserIds: [application.userId],
                    createdBy: user.id,
                },
            });

            // Send email notification
            const applicantUser = await prisma.user.findUnique({
                where: { id: application.userId },
                select: { email: true, name: true }
            });

            if (applicantUser?.email) {
                await sendRecruiterApprovalEmail(
                    applicantUser.email,
                    applicantUser.name || 'there'
                );
            }

            return { success: true };
        }),

    rejectRecruiterApplication: protectedProcedure
        .input(z.object({ applicationId: z.string(), reason: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            const application = await prisma.recruiterApplication.findUnique({
                where: { id: input.applicationId },
            });

            if (!application) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
            }

            // Update application status
            await prisma.recruiterApplication.update({
                where: { id: input.applicationId },
                data: {
                    status: 'REJECTED',
                    reviewedBy: user.id,
                    reviewedAt: new Date(),
                    rejectionReason: input.reason,
                },
            });

            // Send in-app notification
            await prisma.announcement.create({
                data: {
                    title: 'Recruiter Application Update',
                    content: `Your recruiter application has been rejected. Reason: ${input.reason}`,
                    type: 'in-app',
                    targetUserIds: [application.userId],
                    createdBy: user.id,
                },
            });

            // Send email notification
            const applicantUser = await prisma.user.findUnique({
                where: { id: application.userId },
                select: { email: true, name: true }
            });

            if (applicantUser?.email) {
                await sendRecruiterRejectionEmail(
                    applicantUser.email,
                    applicantUser.name || 'there',
                    input.reason
                );
            }

            return { success: true };
        }),

    // --- Push Notifications ---
    sendJobNotifications: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            try {
                const subscriptions = await prisma.pushSubscription.findMany({
                    where: { userId: input.userId },
                });

                if (subscriptions.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'User has no active push subscriptions' });
                }

                const targetUser = await prisma.user.findUnique({
                    where: { id: input.userId },
                    select: {
                        selectedTopics: true,
                        experienceLevel: true,
                        location: true,
                        jobType: true,
                        remotePreference: true,
                    },
                });

                if (!targetUser) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
                }

                const jobs = await prisma.jobs.findMany({
                    where: {},
                    take: 3,
                    orderBy: { created_at: 'desc' },
                    select: {
                        id: true,
                        job_title: true,
                        employer_name: true,
                        job_location: true,
                    },
                });

                if (jobs.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'No matching jobs found' });
                }

                const jobTitles = jobs.map(j => j.job_title).join(', ');
                const notificationTitle = 'New Job Matches!';
                const notificationBody = `We found ${jobs.length} perfect matches for you: ${jobTitles}`;

                // Create persistent in-app notification
                await prisma.announcement.create({
                    data: {
                        title: notificationTitle,
                        content: notificationBody,
                        type: 'in-app', // Use 'in-app' so it appears in the list. Push is handled separately below.
                        targetUserIds: [input.userId],
                        createdBy: ctx.session.user.id,
                    },
                });

                const notification = {
                    title: notificationTitle,
                    body: notificationBody,
                    icon: '/niena.png',
                };

                const data = {
                    type: 'job_alert',
                    url: '/job-search',
                    jobIds: jobs.map(j => j.id).join(','),
                };

                const tokens = subscriptions.map(s => s.endpoint);

                // Use multicast for performance
                const result = await sendMulticastPushNotification(tokens, notification, data);

                if (!result.success) {
                    throw new Error(result.error || 'Failed to send notifications');
                }

                // Handle invalid tokens
                if ((result.failureCount ?? 0) > 0 && result.responses) {
                    const invalidTokens: string[] = [];
                    result.responses.forEach((resp, idx) => {
                        if (!resp.success && (
                            resp.error?.code === 'messaging/invalid-registration-token' ||
                            resp.error?.code === 'messaging/registration-token-not-registered'
                        )) {
                            invalidTokens.push(tokens[idx]);
                        }
                    });

                    if (invalidTokens.length > 0) {
                        await prisma.pushSubscription.deleteMany({
                            where: { endpoint: { in: invalidTokens } },
                        });
                    }
                }

                return {
                    success: true,
                    message: `Sent notifications to ${result.successCount} devices`,
                    jobCount: jobs.length,
                };
            } catch (error: any) {
                console.error('Error sending job notifications:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to send job notifications',
                });
            }
        }),

    sendGlobalJobNotifications: protectedProcedure
        .mutation(async ({ ctx }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            try {
                // 1. Get all active subscriptions
                const subscriptions = await prisma.pushSubscription.findMany({});

                if (subscriptions.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'No active push subscriptions found in the system' });
                }

                // 2. Fetch latest jobs
                const jobs = await prisma.jobs.findMany({
                    where: {},
                    take: 3,
                    orderBy: { created_at: 'desc' },
                });

                if (jobs.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'No jobs found to send' });
                }

                const jobTitles = jobs.map(j => j.job_title).join(', ');
                const notificationTitle = '🎯 New Jobs Available!';
                const notificationBody = `Check out the latest ${jobs.length} jobs: ${jobTitles}`;

                // 3. Create persistent in-app announcements for ALL users
                // We use createMany for performance
                // First get unique user IDs from subscriptions
                const userIds = [...new Set(subscriptions.map(s => s.userId))];

                // Create one announcement for everyone (using targetRoles or explicit IDs)
                // Since this is "Global", we can use a system-wide announcement logic or just target all users
                // For now, let's target specifically the users who have push enabled to ensure they see it in history
                await prisma.announcement.create({
                    data: {
                        title: notificationTitle,
                        content: `${notificationBody}\n\nView them here: /dashboard/jobs`,
                        type: 'both', // persistent + push
                        targetUserIds: userIds, // Target all subscribed users
                        createdBy: ctx.session.user.id,
                    },
                });

                // 4. Send Multicast Push
                const tokens = subscriptions.map(s => s.endpoint);
                const notification = {
                    title: notificationTitle,
                    body: notificationBody,
                    icon: '/niena.png',
                };
                const data = {
                    type: 'job_alert',
                    url: '/dashboard/jobs',
                    jobIds: jobs.map(j => j.id).join(','),
                };

                // Use multicast for performance
                // Note: FCM multicast has a limit of 500 tokens per call. 
                // For a real prod app with >500 users, we'd need to batch this.
                // Assuming <500 for now.
                const result = await sendMulticastPushNotification(tokens, notification, data);

                if (!result.success) {
                    throw new Error(result.error || 'Failed to send global notifications');
                }

                // Handle invalid tokens
                if ((result.failureCount ?? 0) > 0 && result.responses) {
                    const invalidTokens: string[] = [];
                    result.responses.forEach((resp, idx) => {
                        if (!resp.success && (
                            resp.error?.code === 'messaging/invalid-registration-token' ||
                            resp.error?.code === 'messaging/registration-token-not-registered'
                        )) {
                            invalidTokens.push(tokens[idx]);
                        }
                    });

                    if (invalidTokens.length > 0) {
                        await prisma.pushSubscription.deleteMany({
                            where: { endpoint: { in: invalidTokens } },
                        });
                    }
                }

                return {
                    success: true,
                    message: `Sent global alerts to ${result.successCount} devices`,
                    totalSubscribers: tokens.length,
                };

            } catch (error: any) {
                console.error('Error sending global notifications:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to send global notifications',
                });
            }
        }),

    sendCustomNotification: protectedProcedure
        .input(
            z.object({
                userIds: z.array(z.string()).min(1),
                title: z.string().min(1).max(100),
                body: z.string().min(1).max(200),
                url: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
            if (user?.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });

            try {
                const subscriptions = await prisma.pushSubscription.findMany({
                    where: { userId: { in: input.userIds } },
                });

                if (subscriptions.length === 0) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'No active push subscriptions found for the selected users',
                    });
                }

                const notification = {
                    title: input.title,
                    body: input.body,
                    icon: '/niena.png',
                };

                const data = {
                    type: 'custom',
                    url: input.url || '/dashboard',
                };

                const tokens = subscriptions.map(s => s.endpoint);
                const result = await sendMulticastPushNotification(tokens, notification, data);

                return {
                    success: true,
                    message: `Sent to ${result.successCount} devices`,
                    successCount: result.successCount,
                    failureCount: result.failureCount,
                };
            } catch (error: any) {
                console.error('Error sending custom notification:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to send notification',
                });
            }
        }),

    getPushSubscriptionStats: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
        if (user?.role !== 'admin') {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
        }

        const totalSubscriptions = await prisma.pushSubscription.count();
        const uniqueUsers = await prisma.pushSubscription.groupBy({
            by: ['userId'],
        });

        return {
            totalSubscriptions,
            uniqueUsers: uniqueUsers.length,
            averageDevicesPerUser:
                uniqueUsers.length > 0 ? (totalSubscriptions / uniqueUsers.length).toFixed(2) : 0,
        };
    }),
});
