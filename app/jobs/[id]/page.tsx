import { Metadata, ResolvingMetadata } from 'next';
import prisma from '@/lib/prisma';
import JobDetailsPage from './JobDetailsClient';
import { getAbsoluteUrl } from '@/lib/utils';

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * generateMetadata
 * Fetches the job details to create dynamic SEO and Social sharing tags.
 */
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;

    const job = await prisma.jobs.findUnique({
        where: { id },
        include: {
            recruiterJob: {
                include: {
                    recruiter: {
                        include: {
                            recruiterApplication: true
                        }
                    }
                }
            }
        }
    });

    if (!job) {
        return {
            title: 'Job Not Found | Neina',
        };
    }

    const title = `${job.job_title} at ${job.employer_name}`;
    const description = job.job_description?.substring(0, 160) || `Check out this job opening on Neina.`;
    const logo = job.recruiterJob?.recruiter?.recruiterApplication?.companyLogo || job.employer_logo;
    const url = getAbsoluteUrl(`/jobs/${id}`);

    return {
        title: `${title} | Neina`,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: 'Neina',
            images: logo ? [{ url: logo }] : [],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: logo ? [logo] : [],
        },
    };
}

export default async function Page({ params }: Props) {
    return <JobDetailsPage />;
}
