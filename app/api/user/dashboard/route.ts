import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch all required data in parallel
        const [
            user,
            resumes,
            interviews,
            recentInterviews,
            jobs
        ] = await Promise.all([
            // 1. User details
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    name: true,
                    email: true,
                    image: true,
                    remaining_minutes: true,
                    resume_credits: true,
                    emailVerified: true,
                }
            }),

            // 2. Resumes stats
            prisma.resume.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    updatedAt: true,
                    scoreData: true,
                }
            }),

            // 3. Interview stats (count)
            prisma.interview.count({
                where: { user_id: userId, status: 'ENDED' }
            }),

            // 4. Recent interviews
            prisma.interview.findMany({
                where: { user_id: userId },
                orderBy: { start_time: 'desc' },
                take: 3,
                select: {
                    id: true,
                    role: true,
                    start_time: true,
                    status: true,
                    duration_seconds: true
                }
            }),

            // 5. Jobs - Fetch more jobs to perform matching
            prisma.jobs.findMany({
                take: 50, // Fetch pool of jobs to rank
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    job_title: true,
                    employer_name: true,
                    job_location: true,
                    job_is_remote: true,
                    created_at: true,
                    employer_logo: true,
                    job_skills: {
                        select: {
                            skill_text: true
                        }
                    }
                }
            })
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- Calculate Metrics & Matching ---

        // 1. Get User Skills from latest resume
        let userSkills = new Set<string>();
        if (resumes.length > 0) {
            const latestResumeId = resumes[0].id;
            const resumeSkillsData = await prisma.resume_skills.findUnique({
                where: { resume_id: latestResumeId }
            });

            if (resumeSkillsData?.skill_text) {
                // Split by common delimiters and normalize
                resumeSkillsData.skill_text
                    .split(/[,;\n]+/)
                    .map(s => s.trim().toLowerCase())
                    .filter(s => s.length > 0)
                    .forEach(s => userSkills.add(s));
            }
        }

        // 2. Score Jobs
        const scoredJobs = jobs.map(job => {
            const jobSkills = job.job_skills?.skill_text || [];
            let score = 0;

            if (jobSkills.length > 0) {
                const matchCount = jobSkills.reduce((count, skill) => {
                    return userSkills.has(skill.toLowerCase().trim()) ? count + 1 : count;
                }, 0);
                score = Math.round((matchCount / jobSkills.length) * 100);
            } else {
                // Fallback if job has no skills listed: Random score for demo or 0
                // Using a lower random range to prefer jobs with actual matches
                score = Math.floor(Math.random() * 30);
            }

            return { ...job, matchScore: score };
        });

        // 3. Sort by Match Score and take top 4
        const topJobs = scoredJobs
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 4);

        // --- Calculate Metrics ---

        // 1. Profile Completion
        let profileScore = 40; // Base score for account creation
        if (user.name) profileScore += 10;
        if (user.emailVerified) profileScore += 20;
        if (resumes.length > 0) profileScore += 30;

        // 2. Resume Strength
        let resumeStrength = 0;
        if (resumes.length > 0) {
            const latestResume = resumes[0];
            const score = (latestResume.scoreData as any)?.overallScore || 0;
            resumeStrength = score;
        }

        // 3. Interview Readiness
        const interviewReadiness = Math.min(100, interviews * 20);

        // 4. Job Match Rate
        const jobMatchRate = resumes.length > 0 ? 75 : 0;

        // 5. Recent Activity
        const activity = [
            ...recentInterviews.map(i => ({
                type: 'interview',
                title: `Interview for ${i.role || 'Unknown Role'}`,
                date: i.start_time,
                status: i.status === 'ENDED' ? 'completed' : i.status === 'ACTIVE' ? 'in-progress' : 'pending',
                id: i.id
            })),
            ...resumes.slice(0, 3).map(r => ({
                type: 'resume',
                title: `Updated resume: ${r.name}`,
                date: r.updatedAt,
                status: 'completed',
                id: r.id
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        return NextResponse.json({
            name: user.name,
            email: user.email,
            image: user.image,
            credits: user.remaining_minutes,
            resumeCredits: user.resume_credits,

            profileCompletion: profileScore,
            resumeStrength,
            jobMatchRate,

            aiInsight: {
                readiness: interviewReadiness,
                interviewCount: interviews,
            },

            recentActivity: activity,

            jobs: topJobs.map(job => ({
                id: job.id,
                title: job.job_title || 'Untitled Position',
                company: job.employer_name || 'Unknown Company',
                location: job.job_location || 'Remote',
                type: job.job_is_remote ? 'Remote' : 'On-site',
                posted: job.created_at ? new Date(job.created_at).toISOString() : new Date().toISOString(),
                match: job.matchScore,
                isNew: true
            }))
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
