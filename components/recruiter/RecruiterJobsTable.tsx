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
    ChevronRight,
    Search
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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



    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to close this job? This cannot be undone.")) {
            deleteMutation.mutate({ recruiterJobId: id });
        }
    };



    if (jobs.length === 0) {
        return (
            <div className="rounded-2xl border-2 border-dashed p-20 text-center text-muted-foreground bg-muted/5">
                <div className="max-w-xs mx-auto space-y-4">
                    <Briefcase className="h-10 w-10 mx-auto opacity-20" />
                    <p className="text-sm font-medium">No jobs found. Start by posting a new job listing to build your pipeline.</p>
                </div>
            </div>
        );
    }

    return (
        <Card className="rounded-2xl border-indigo-100/50 shadow-sm overflow-hidden bg-gradient-to-br from-white/90 via-white/60 to-indigo-50/30 backdrop-blur-md">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="py-4 px-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Position</TableHead>
                            <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                            <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Talent Reach</TableHead>
                            <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Posted Date</TableHead>
                            <TableHead className="py-4 px-8 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-5 px-8">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{job.job.job_title}</span>
                                        <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                            {job.job.job_location} {job.job.job_is_remote ? '(Remote)' : ''}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <StatusBadge status={job.status} />
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold">{job._count.candidates}</span>
                                            <span className="text-[9px] font-medium text-muted-foreground">Applicants</span>
                                        </div>
                                        <div className="flex flex-col items-center border-l pl-6">
                                            <span className="text-xs font-bold">{job._count.jobViews}</span>
                                            <span className="text-[9px] font-medium text-muted-foreground">Reach</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5 text-xs font-medium text-muted-foreground">
                                    {format(new Date(job.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="py-5 px-8 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl p-2 w-48 shadow-lg border-border/50">
                                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest px-2 pb-1.5 opacity-40">Management</DropdownMenuLabel>
                                            <DropdownMenuItem asChild className="rounded-lg py-2 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer">
                                                <Link href={`/recruiters/pipeline/${job.id}`} className="flex items-center w-full font-medium text-indigo-600">
                                                    <Users className="mr-2 h-4 w-4 text-indigo-500" /> Pipeline
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="rounded-lg py-2 focus:bg-primary/5 focus:text-primary cursor-pointer">
                                                <Link href={`/recruiters/jobs/${job.id}/edit`} className="flex items-center w-full">
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Role
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1.5 opacity-50" />

                                            <DropdownMenuItem
                                                onClick={() => handleDelete(job.id)}
                                                className="text-red-500 focus:text-red-500 focus:bg-red-50 rounded-lg py-2 cursor-pointer"
                                            >
                                                <Trash className="mr-2 h-4 w-4" /> Close Role
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "ACTIVE":
            return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none rounded-md text-[9px] font-bold px-2 py-0.5">Active</Badge>;
        case "PAUSED":
            return <Badge variant="secondary" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none rounded-md text-[9px] font-bold px-2 py-0.5">Paused</Badge>;
        case "CLOSED":
            return <Badge variant="destructive" className="rounded-md text-[9px] font-bold px-2 py-0.5">Closed</Badge>;
        default:
            return <Badge variant="outline" className="rounded-md text-[9px] font-bold px-2 py-0.5">{status}</Badge>;
    }
}

function Briefcase(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            <rect width="20" height="14" x="2" y="6" rx="2" />
        </svg>
    );
}

