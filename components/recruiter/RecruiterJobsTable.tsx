"use client";

import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Eye,
    Edit,
    Users,
    Trash,
    PauseCircle,
    PlayCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Job {
    id: string; // recruiterJobId
    status: string;
    createdAt: string;
    job: {
        job_title: string;
        job_location: string;
        job_is_remote: boolean;
    };
    _count: {
        candidates: number;
        jobViews: number;
    }
}

interface RecruiterJobsTableProps {
    jobs: any[]; // types need refinement
    onUpdate: () => void;
}

export function RecruiterJobsTable({ jobs, onUpdate }: RecruiterJobsTableProps) {
    const router = useRouter();
    const utils = trpc.useUtils();

    const deleteMutation = trpc.recruiter.deleteJob.useMutation({
        onSuccess: () => {
            toast.success("Job closed successfully");
            onUpdate();
        },
        onError: (error) => toast.error(error.message),
    });

    const toggleStatusMutation = trpc.recruiter.toggleJobStatus.useMutation({
        onSuccess: () => {
            toast.success("Job status updated");
            onUpdate();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to close this job? This cannot be undone.")) {
            deleteMutation.mutate({ recruiterJobId: id });
        }
    };

    const handleToggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        toggleStatusMutation.mutate({ recruiterJobId: id, status: newStatus });
    };

    if (jobs.length === 0) {
        return (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                No jobs found. Start by posting a new job!
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applicants</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Posted Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{job.job.job_title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {job.job.job_location} {job.job.job_is_remote ? '(Remote)' : ''}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={job.status} />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{job._count.candidates}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>{job._count.jobViews}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {format(new Date(job.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/recruiters/pipeline/${job.id}`}>
                                                <Users className="mr-2 h-4 w-4" /> View Candidates
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/recruiters/jobs/${job.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Job
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {job.status !== 'CLOSED' && (
                                            <DropdownMenuItem onClick={() => handleToggleStatus(job.id, job.status)}>
                                                {job.status === 'ACTIVE' ? (
                                                    <>
                                                        <PauseCircle className="mr-2 h-4 w-4" /> Pause Job
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlayCircle className="mr-2 h-4 w-4" /> Activate Job
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(job.id)}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash className="mr-2 h-4 w-4" /> Close Job
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "ACTIVE":
            return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
        case "PAUSED":
            return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600">Paused</Badge>;
        case "CLOSED":
            return <Badge variant="destructive">Closed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}
