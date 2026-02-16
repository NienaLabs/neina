'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Building2, Calendar, Globe, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const { data: job, isLoading, error } = trpc.jobs.getJob.useQuery({ id: jobId });
    const { mutate: applyToJob, isPending: isApplying, isSuccess: isApplied } = trpc.jobs.applyToJob.useMutation({
        onSuccess: (data) => {
            toast.success('Successfully applied to job!');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const { mutate: recordView } = trpc.jobs.recordView.useMutation();

    useEffect(() => {
        if (jobId) {
            recordView({ jobId });
        }
    }, [jobId, recordView]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="container mx-auto flex h-[50vh] flex-col items-center justify-center text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Job not found</h2>
                <p className="mt-2 text-gray-500">The job you are looking for may have been removed.</p>
            </div>
        );
    }

    const isRecruiterJob = !!job.recruiterJob;
    const isJSearchJob = !isRecruiterJob;

    const handleApply = () => {
        if (isRecruiterJob) {
            // Internal Apply redirect
            router.push(`/jobs/${jobId}/apply`);
        } else {
            // JSearch / External Job
            if (job.job_apply_link) {
                window.open(job.job_apply_link, '_blank');
            } else {
                toast.error("No application link available for this job.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-violet-50/50 via-purple-50/30 to-white pb-20 pt-12 dark:from-violet-950/20 dark:via-purple-950/10 dark:to-zinc-950">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
                {/* Header Section */}
                <div className="mb-6 flex flex-col gap-6 rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/60 md:mb-10 md:gap-8 md:flex-row md:items-start md:justify-between md:p-8">
                    <div className="flex items-start gap-6">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                            {isRecruiterJob && (job as any).recruiterJob?.recruiter?.recruiterApplication?.companyLogo ? (
                                <img
                                    src={(job as any).recruiterJob.recruiter.recruiterApplication.companyLogo}
                                    alt={job.employer_name || 'Company Logo'}
                                    className="h-16 w-16 object-contain"
                                />
                            ) : job.employer_logo ? (
                                <img src={job.employer_logo} alt={job.employer_name || 'Logo'} className="h-16 w-16 object-contain" />
                            ) : (
                                <Building2 className="h-10 w-10 text-violet-300 dark:text-violet-700" />
                            )}
                        </div>
                        <div>
                            <h1 className="bg-gradient-to-r from-black via-purple-600 to-indigo-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 md:text-3xl lg:text-4xl">
                                {job.job_title}
                            </h1>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                                    <Building2 className="h-4 w-4" />
                                    {job.employer_name}
                                </span>
                                <span className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                    <MapPin className="h-4 w-4" />
                                    {job.job_location || 'Remote'}
                                </span>
                                {job.job_posted_at && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                                        <Calendar className="h-4 w-4" />
                                        {job.job_posted_at}
                                    </span>
                                )}
                                {job.job_is_remote && (
                                    <Badge variant="secondary" className="bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-500/10 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:ring-fuchsia-500/30">Remote</Badge>
                                )}
                                {isRecruiterJob ? (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 ring-1 ring-blue-500/10 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-500/30">
                                        Verified Position
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-200 dark:border-gray-800">
                                        External Source
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 md:w-auto">
                        <Button
                            size="lg"
                            className="h-14 w-full rounded-full bg-black px-10 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl hover:shadow-violet-500/30 dark:bg-white dark:text-black dark:shadow-violet-900/50 dark:hover:bg-zinc-200 md:w-auto"
                            onClick={handleApply}
                            disabled={isApplying || (isRecruiterJob && isApplied)}
                        >
                            {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRecruiterJob ? (isApplied ? 'Applied' : 'Easy Apply') : 'Apply Now'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="mb-6 w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 pb-2 md:pb-0">
                                <TabsTrigger
                                    value="description"
                                    className="rounded-full border border-transparent bg-white/50 px-6 py-2.5 text-gray-600 shadow-sm transition-all hover:bg-white data-[state=active]:border-violet-100 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md dark:bg-zinc-900/50 dark:text-gray-400 dark:hover:bg-zinc-900 dark:data-[state=active]:border-violet-900/30 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-violet-300"
                                >
                                    Description
                                </TabsTrigger>
                                <TabsTrigger
                                    value="qualifications"
                                    className="rounded-full border border-transparent bg-white/50 px-6 py-2.5 text-gray-600 shadow-sm transition-all hover:bg-white data-[state=active]:border-violet-100 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md dark:bg-zinc-900/50 dark:text-gray-400 dark:hover:bg-zinc-900 dark:data-[state=active]:border-violet-900/30 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-violet-300"
                                >
                                    Qualifications
                                </TabsTrigger>
                                <TabsTrigger
                                    value="responsibilities"
                                    className="rounded-full border border-transparent bg-white/50 px-6 py-2.5 text-gray-600 shadow-sm transition-all hover:bg-white data-[state=active]:border-violet-100 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md dark:bg-zinc-900/50 dark:text-gray-400 dark:hover:bg-zinc-900 dark:data-[state=active]:border-violet-900/30 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-violet-300"
                                >
                                    Responsibilities
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80">
                                <h3 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">About the Job</h3>
                                <div className="prose prose-lg max-w-none text-gray-600 dark:prose-invert dark:text-gray-300">
                                    <p className="whitespace-pre-line leading-relaxed">{job.job_description}</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="qualifications" className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80">
                                <h3 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Qualifications</h3>
                                <ul className="list-inside list-disc space-y-3 text-lg text-gray-600 dark:text-gray-300">
                                    {(job.qualifications || []).map((qual, i) => (
                                        <li key={i} className="leading-relaxed">{qual}</li>
                                    ))}
                                    {(!job.qualifications || job.qualifications.length === 0) && (
                                        <p className="italic text-gray-500">No specific qualifications listed.</p>
                                    )}
                                </ul>
                            </TabsContent>

                            <TabsContent value="responsibilities" className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80">
                                <h3 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Responsibilities</h3>
                                <ul className="list-inside list-disc space-y-3 text-lg text-gray-600 dark:text-gray-300">
                                    {(job.responsibilities || []).map((resp, i) => (
                                        <li key={i} className="leading-relaxed">{resp}</li>
                                    ))}
                                    {(!job.responsibilities || job.responsibilities.length === 0) && (
                                        <p className="italic text-gray-500">No specific responsibilities listed.</p>
                                    )}
                                </ul>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar info */}
                    <div className="space-y-6">
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Job Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800/50">
                                    <span className="flex items-center gap-2.5 text-gray-500"><Briefcase className="h-4 w-4 text-violet-500" /> Job Type</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Full-time</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800/50">
                                    <span className="flex items-center gap-2.5 text-gray-500"><MapPin className="h-4 w-4 text-violet-500" /> Location</span>
                                    <span className="font-medium text-right text-gray-900 dark:text-gray-100">{job.job_location || 'Remote'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800/50">
                                    <span className="flex items-center gap-2.5 text-gray-500"><Globe className="h-4 w-4 text-violet-500" /> Remote</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{job.job_is_remote ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2.5 text-gray-500"><Calendar className="h-4 w-4 text-violet-500" /> Posted</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{job.job_posted_at ? job.job_posted_at : 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Skills Widget */}
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Required Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {/* Try to get skills from qualifications if structured, otherwise fallback */}
                                    {job.qualifications && job.qualifications.length > 0 ? (
                                        job.qualifications.map((skill, i) => (
                                            <Badge key={i} variant="outline" className="border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-800/50 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30">
                                                {skill}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No structured skills found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
