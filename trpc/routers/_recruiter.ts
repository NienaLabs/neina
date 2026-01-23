
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import prisma from '@/lib/prisma';
import { sendRecruiterApplicationReceivedEmail, sendCandidateStatusUpdateEmail } from '@/lib/email';
import { inngest } from '@/inngest/client';

export const recruiterRouter = createTRPCRouter({
    applyForRecruiter: protectedProcedure
        .input(
            z.object({
                companyName: z.string().min(1, 'Company name is required'),
                companyWebsite: z.string().url('Invalid website URL').optional(),
                position: z.string().min(1, 'Position is required'),
                phoneNumber: z.string().min(1, 'Phone number is required'),
                linkedInProfile: z.string().url('Invalid LinkedIn URL').optional(),
                companyLogo: z.string().optional(),
                verificationDocuments: z.string().min(1, 'Verification documents are required'),
                message: z.string().min(10, 'Please provide a message (minimum 10 characters)'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Check if user already has an application
            const existingApplication = await prisma.recruiterApplication.findUnique({
                where: { userId },
            });

            if (existingApplication) {
                if (existingApplication.status === "PENDING") {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'You have already submitted an application',
                    });
                }

                if (existingApplication.status === "APPROVED") {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'You are already a recruiter',
                    });
                }

                // If REJECTED, allow re-application via update
                const application = await prisma.recruiterApplication.update({
                    where: { userId },
                    data: {
                        ...input,
                        status: "PENDING",
                        rejectionReason: null,
                        reviewedBy: null,
                        reviewedAt: null,
                        updatedAt: new Date(),
                    },
                });

                // Send email notification
                // We need to fetch user for existing application update as we didn't fetch it before
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, name: true },
                });

                if (user) {
                    await sendRecruiterApplicationReceivedEmail(user.email, user.name || 'User');

                    // Create in-app notification
                    await prisma.announcement.create({
                        data: {
                            title: 'Application Received',
                            content: 'We have received your recruiter application and will get back to you shortly.',
                            type: 'in-app',
                            targetUserIds: [userId],
                            createdBy: 'system',
                        },
                    });
                }

                return { success: true, application };
            }

            // Get user email for new application
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, name: true },
            });

            if (!user) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
            }

            // Create application
            const application = await prisma.recruiterApplication.create({
                data: {
                    userId,
                    email: user.email,
                    ...input,
                },
            });

            // Send email notification
            await sendRecruiterApplicationReceivedEmail(user.email, user.name || 'User');

            // Create in-app notification
            await prisma.announcement.create({
                data: {
                    title: 'Application Received',
                    content: 'We have received your recruiter application and will get back to you shortly.',
                    type: 'in-app',
                    targetUserIds: [userId],
                    createdBy: 'system',
                },
            });

            return { success: true, application };
        }),

    /**
     * Get current user's recruiter application status
     */
    getMyApplication: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const application = await prisma.recruiterApplication.findUnique({
            where: { userId },
        });

        return application;
    }),

    // --- Job Posting (requires recruiter role) ---

    /**
     * Create a new job posting
     * Requires user to have recruiter role
     */
    createJob: protectedProcedure
        .input(
            z.object({
                job_title: z.string().min(1, 'Job title is required'),
                employer_name: z.string().min(1, 'Employer name is required'),
                job_location: z.string().optional(),
                job_description: z.string().optional(),
                job_apply_link: z.string().url('Invalid application link').optional().or(z.literal('')),
                category: z.string().optional(),
                job_is_remote: z.boolean().optional(),
                qualifications: z.array(z.string()).optional(),
                responsibilities: z.array(z.string()).optional(),
                jobCertifications: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Check if user has recruiter role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });

            if (user?.role !== 'recruiter') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Only verified recruiters can post jobs',
                });
            }

            const { jobCertifications, ...jobData } = input;

            // Fetch recruiter's company logo from application
            const recruiterApp = await prisma.recruiterApplication.findUnique({
                where: { userId },
                select: { companyLogo: true }
            });

            // Create job in jobs table
            const job = await prisma.jobs.create({
                data: {
                    ...jobData,
                    employer_logo: recruiterApp?.companyLogo || null,
                    qualifications: input.qualifications || [],
                    responsibilities: input.responsibilities || [],
                    category: input.category,
                    job_publisher: 'recruiter',
                },
            });

            // Create RecruiterJob link
            const recruiterJob = await prisma.recruiterJob.create({
                data: {
                    recruiterId: userId,
                    jobId: job.id,
                    jobCertifications: jobCertifications || [],
                },
            });

            // Trigger Inngest to process the job (embeddings, etc.)
            await inngest.send({
                name: 'recruiter/job.created',
                data: { jobId: job.id },
            });

            return { success: true, job, recruiterJob };
        }),

    /**
     * Get all jobs posted by current recruiter
     */
    getMyJobs: protectedProcedure
        .input(
            z.object({
                status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Check recruiter role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });

            if (user?.role !== 'recruiter') {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const where: any = { recruiterId: userId };
            if (input.status) {
                where.status = input.status;
            }

            const recruiterJobs = await prisma.recruiterJob.findMany({
                where,
                include: {
                    job: {
                        include: {
                            _count: {
                                select: { jobViews: true }
                            }
                        }
                    },
                    _count: {
                        select: {
                            candidates: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return recruiterJobs;
        }),

    /**
     * Update job posting
     */
    updateJob: protectedProcedure
        .input(
            z.object({
                recruiterJobId: z.string(),
                job_title: z.string().optional(),
                employer_name: z.string().optional(),
                job_location: z.string().optional(),
                job_description: z.string().optional(),
                job_apply_link: z.string().url('Invalid application link').optional().or(z.literal('')),
                category: z.string().optional(),
                job_is_remote: z.boolean().optional(),
                qualifications: z.array(z.string()).optional(),
                responsibilities: z.array(z.string()).optional(),
                jobCertifications: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { recruiterJobId, jobCertifications, ...jobData } = input;

            // Verify ownership
            const recruiterJob = await prisma.recruiterJob.findUnique({
                where: { id: recruiterJobId },
                select: { recruiterId: true, jobId: true },
            });

            if (!recruiterJob || recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Fetch recruiter's company logo
            const recruiterApp = await prisma.recruiterApplication.findUnique({
                where: { userId },
                select: { companyLogo: true }
            });

            // Update job
            const updatedJob = await prisma.jobs.update({
                where: { id: recruiterJob.jobId },
                data: {
                    ...jobData,
                    employer_logo: recruiterApp?.companyLogo || undefined,
                },
            });

            // Update recruiter job (certifications)
            if (jobCertifications) {
                await prisma.recruiterJob.update({
                    where: { id: recruiterJobId },
                    data: { jobCertifications },
                });
            }

            return { success: true, job: updatedJob };
        }),

    /**
     * Delete/close job posting
     */
    deleteJob: protectedProcedure
        .input(z.object({ recruiterJobId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const recruiterJob = await prisma.recruiterJob.findUnique({
                where: { id: input.recruiterJobId },
                select: { recruiterId: true, jobId: true },
            });

            if (!recruiterJob || recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Mark as closed
            await prisma.recruiterJob.update({
                where: { id: input.recruiterJobId },
                data: {
                    status: 'CLOSED',
                    closedAt: new Date(),
                },
            });

            // Optionally delete the job from jobs table
            await prisma.jobs.delete({
                where: { id: recruiterJob.jobId },
            });

            return { success: true };
        }),

    /**
     * Toggle job status (pause/resume)
     */
    toggleJobStatus: protectedProcedure
        .input(
            z.object({
                recruiterJobId: z.string(),
                status: z.enum(['ACTIVE', 'PAUSED']),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const recruiterJob = await prisma.recruiterJob.findUnique({
                where: { id: input.recruiterJobId },
                select: { recruiterId: true },
            });

            if (!recruiterJob || recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Update status
            const updated = await prisma.recruiterJob.update({
                where: { id: input.recruiterJobId },
                data: { status: input.status },
            });

            return { success: true, recruiterJob: updated };
        }),

    // --- Candidate Pipeline ---

    /**
     * Add candidate to job pipeline
     */
    addCandidate: protectedProcedure
        .input(
            z.object({
                recruiterJobId: z.string(),
                candidateName: z.string().min(1, 'Candidate name is required'),
                candidateEmail: z.string().email('Invalid email'),
                resumeId: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const recruiterJob = await prisma.recruiterJob.findUnique({
                where: { id: input.recruiterJobId },
                select: { recruiterId: true },
            });

            if (!recruiterJob || recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Create candidate
            const candidate = await prisma.candidatePipeline.create({
                data: input,
            });

            // Increment application count
            await prisma.recruiterJob.update({
                where: { id: input.recruiterJobId },
                data: { applicationCount: { increment: 1 } },
            });

            return { success: true, candidate };
        }),

    /**
     * Get candidates for a specific job
     */
    getCandidates: protectedProcedure
        .input(
            z.object({
                recruiterJobId: z.string(),
                status: z.enum(['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'HIRED']).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const recruiterJob = await prisma.recruiterJob.findUnique({
                where: { id: input.recruiterJobId },
                select: { recruiterId: true },
            });

            if (!recruiterJob || recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const where: any = { recruiterJobId: input.recruiterJobId };
            if (input.status) {
                where.status = input.status;
            }

            const candidates = await prisma.candidatePipeline.findMany({
                where,
                include: {
                    resume: {
                        select: {
                            id: true,
                            name: true,
                            content: true
                        }
                    }
                },
                orderBy: { appliedAt: 'desc' },
            });

            return candidates;
        }),

    /**
     * Update candidate status
     */
    updateCandidateStatus: protectedProcedure
        .input(
            z.object({
                candidateId: z.string(),
                status: z.enum(['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'HIRED']),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get candidate and verify ownership
            const candidate = await prisma.candidatePipeline.findUnique({
                where: { id: input.candidateId },
                include: {
                    recruiterJob: {
                        select: { recruiterId: true },
                    },
                },
            });

            if (!candidate || candidate.recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Update candidate
            const updated = await prisma.candidatePipeline.update({
                where: { id: input.candidateId },
                data: {
                    status: input.status,
                    notes: input.notes ?? candidate.notes,
                },
                include: {
                    recruiterJob: {
                        include: {
                            job: {
                                select: { job_title: true }
                            }
                        }
                    }
                }
            });

            // Send notification email if status changed
            if (candidate.status !== input.status) {
                const jobTitle = updated.recruiterJob.job.job_title || 'Application';

                // 1. Email Notification
                try {
                    await sendCandidateStatusUpdateEmail(
                        updated.candidateEmail,
                        updated.candidateName,
                        jobTitle,
                        input.status
                    );
                } catch (error) {
                    console.error('Failed to send status update email:', error);
                }

                // 2. In-App Notification
                try {
                    // Check if candidate has a user account
                    const userAccount = await prisma.user.findUnique({
                        where: { email: updated.candidateEmail },
                        select: { id: true }
                    });

                    if (userAccount) {
                        const statusLabels: Record<string, string> = {
                            'NEW': 'Received',
                            'REVIEWING': 'Under Review',
                            'SHORTLISTED': 'Shortlisted',
                            'INTERVIEWED': 'Interviewed',
                            'OFFERED': 'Offer Received',
                            'REJECTED': 'Updated',
                            'HIRED': 'Hired'
                        };
                        const friendlyStatus = statusLabels[input.status] || input.status;

                        await prisma.announcement.create({
                            data: {
                                title: 'Application Update',
                                content: `Your application status for "${jobTitle}" has been updated to ${friendlyStatus}.`,
                                type: 'in-app',
                                targetUserIds: [userAccount.id],
                                createdBy: 'system',
                            },
                        });
                    }
                } catch (error) {
                    console.error('Failed to create in-app notification:', error);
                }
            }

            return { success: true, candidate: updated };
        }),

    /**
     * Delete candidate
     */
    deleteCandidate: protectedProcedure
        .input(
            z.object({
                candidateId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get candidate and verify ownership
            const candidate = await prisma.candidatePipeline.findUnique({
                where: { id: input.candidateId },
                include: {
                    recruiterJob: {
                        select: { recruiterId: true },
                    },
                },
            });

            if (!candidate || candidate.recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Delete candidate
            await prisma.candidatePipeline.delete({
                where: { id: input.candidateId },
            });

            return { success: true };
        }),

    /**
     * Add notes to candidate
     */
    addCandidateNote: protectedProcedure
        .input(
            z.object({
                candidateId: z.string(),
                notes: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get candidate and verify ownership
            const candidate = await prisma.candidatePipeline.findUnique({
                where: { id: input.candidateId },
                include: {
                    recruiterJob: {
                        select: { recruiterId: true },
                    },
                },
            });

            if (!candidate || candidate.recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Update notes
            const updated = await prisma.candidatePipeline.update({
                where: { id: input.candidateId },
                data: { notes: input.notes },
            });

            return { success: true, candidate: updated };
        }),

    // --- Analytics ---

    /**
     * Get analytics for a specific job
     */
    getJobAnalytics: protectedProcedure
        .input(z.object({ recruiterJobId: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const recruiterJob = await prisma.recruiterJob.findUnique({
                where: { id: input.recruiterJobId },
                include: {
                    job: {
                        include: {
                            _count: {
                                select: { jobViews: true }
                            }
                        }
                    },
                    _count: {
                        select: {
                            candidates: true,
                        },
                    },
                },
            });

            if (!recruiterJob || recruiterJob.recruiterId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Get candidate funnel stats
            const candidatesByStatus = await prisma.candidatePipeline.groupBy({
                by: ['status'],
                where: { recruiterJobId: input.recruiterJobId },
                _count: true,
            });

            // Get views over time (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const viewsByDay = await prisma.jobView.groupBy({
                by: ['viewedAt'],
                where: {
                    jobId: recruiterJob.jobId,
                    viewedAt: { gte: thirtyDaysAgo }
                },
                _count: true
            });

            return {
                totalViews: recruiterJob.job._count.jobViews,
                totalApplications: recruiterJob._count.candidates,
                candidateFunnel: candidatesByStatus.map(stat => ({
                    status: stat.status,
                    count: stat._count,
                })),
                viewsOverTime: viewsByDay.map(row => ({
                    date: row.viewedAt.toISOString().split('T')[0],
                    count: row._count,
                })),
            };
        }),

    /**
     * Get overall analytics for recruiter
     */
    getOverallAnalytics: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Check recruiter role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (user?.role !== 'recruiter') {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Get job counts by status
        const jobsByStatus = await prisma.recruiterJob.groupBy({
            by: ['status'],
            where: { recruiterId: userId },
            _count: true,
        });

        // Get total candidates
        const totalCandidates = await prisma.candidatePipeline.count({
            where: {
                recruiterJob: {
                    recruiterId: userId,
                },
            },
        });

        // Get total views
        const totalViews = await prisma.jobView.count({
            where: {
                job: {
                    recruiterJob: { recruiterId: userId }
                }
            },
        });

        return {
            jobsByStatus: jobsByStatus.map(stat => ({
                status: stat.status,
                count: stat._count,
            })),
            totalCandidates,
            totalViews,
        };
    }),

    /**
     * Get consolidated dashboard data for recruiter
     */
    getRecruiterDashboardData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Check recruiter role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, name: true, image: true, companyName: true },
        });

        if (user?.role !== 'recruiter') {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // 1. Stats
        const jobsByStatus = await prisma.recruiterJob.groupBy({
            by: ['status'],
            where: { recruiterId: userId },
            _count: true,
        });

        const activeJobsCount = jobsByStatus.find(s => s.status === 'ACTIVE')?._count || 0;

        const totalCandidates = await prisma.candidatePipeline.count({
            where: {
                recruiterJob: { recruiterId: userId },
            },
        });

        const candidatesByStatus = await prisma.candidatePipeline.groupBy({
            by: ['status'],
            where: {
                recruiterJob: { recruiterId: userId },
            },
            _count: true,
        });

        const totalViews = await prisma.jobView.count({
            where: {
                job: {
                    recruiterJob: { recruiterId: userId }
                }
            },
        });

        // 2. Recent Activity (last 10 events: new applications and status updates)
        const recentActivities = await prisma.candidatePipeline.findMany({
            where: {
                recruiterJob: { recruiterId: userId },
            },
            include: {
                recruiterJob: {
                    include: { job: { select: { job_title: true } } },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        // 3. Active Jobs Summary (last 5)
        const activeJobs = await prisma.recruiterJob.findMany({
            where: { recruiterId: userId, status: 'ACTIVE' },
            include: {
                job: {
                    include: {
                        _count: {
                            select: { jobViews: true }
                        }
                    }
                },
                _count: {
                    select: {
                        candidates: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // 4. Analytics Trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const viewsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("viewedAt") as date, COUNT(*)::int as count
            FROM "job_view"
            JOIN "jobs" ON "job_view"."jobId" = "jobs"."id"
            JOIN "recruiter_job" ON "jobs"."id" = "recruiter_job"."jobId"
            WHERE "recruiter_job"."recruiterId" = ${userId}
            AND "viewedAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("viewedAt")
            ORDER BY date ASC
        `;

        const applicationsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("appliedAt") as date, COUNT(*)::int as count
            FROM "candidate_pipeline"
            JOIN "recruiter_job" ON "candidate_pipeline"."recruiterJobId" = "recruiter_job"."id"
            WHERE "recruiter_job"."recruiterId" = ${userId}
            AND "appliedAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("appliedAt")
            ORDER BY date ASC
        `;

        // Format trend data for charting
        const trendData: Record<string, { date: string; views: number; applications: number }> = {};

        // Initialize with last 30 days
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            trendData[dateStr] = { date: dateStr, views: 0, applications: 0 };
        }

        viewsByDay.forEach(row => {
            const dateStr = new Date(row.date).toISOString().split('T')[0];
            if (trendData[dateStr]) trendData[dateStr].views = Number(row.count);
        });

        applicationsByDay.forEach(row => {
            const dateStr = new Date(row.date).toISOString().split('T')[0];
            if (trendData[dateStr]) trendData[dateStr].applications = Number(row.count);
        });

        const sortedTrend = Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));

        return {
            user: {
                name: user.name,
                image: user.image,
                companyName: user.companyName,
            },
            stats: {
                activeJobs: activeJobsCount,
                totalCandidates,
                totalViews,
            },
            candidateFunnel: candidatesByStatus.map(s => ({
                status: s.status,
                count: s._count,
            })),
            recentActivities,
            activeJobs,
            trendData: sortedTrend,
        };
    }),

    /**
     * Get candidate resume for recruiter
     * Verifies recruiter ownership and returns resume data
     */
    getResumeForCandidate: protectedProcedure
        .input(z.object({ candidateId: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 1. Get candidate and verify ownership via recruiterJobId
            const candidate = await prisma.candidatePipeline.findUnique({
                where: { id: input.candidateId },
                include: {
                    recruiterJob: {
                        select: { recruiterId: true },
                    },
                    resume: {
                        select: {
                            id: true,
                            name: true,
                            extractedData: true,
                        }
                    }
                },
            });

            if (!candidate || candidate.recruiterJob.recruiterId !== userId) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view this resume."
                });
            }

            if (!candidate.resume) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: "Resume not found for this candidate."
                });
            }

            return candidate.resume;
        }),
});
