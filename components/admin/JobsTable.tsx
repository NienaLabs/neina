"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function JobsTable() {
    const [search, setSearch] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newJob, setNewJob] = useState({
        job_title: "",
        employer_name: "",
        job_location: "",
        job_description: "",
        job_apply_link: "",
        job_is_remote: false,
    });

    const { data, isLoading, isError, error } = trpc.admin.getJobs.useQuery({
        search,
        limit: 20,
    });

    const utils = trpc.useUtils();

    const deleteJobMutation = trpc.admin.deleteJob.useMutation({
        onSuccess: () => {
            utils.admin.getJobs.invalidate();
            toast.success("Job deleted successfully");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const createJobMutation = trpc.admin.createJob.useMutation({
        onSuccess: () => {
            utils.admin.getJobs.invalidate();
            toast.success("Job created successfully");
            setIsAddDialogOpen(false);
            setNewJob({
                job_title: "",
                employer_name: "",
                job_location: "",
                job_description: "",
                job_apply_link: "",
                job_is_remote: false,
            });
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const triggerSyncMutation = trpc.admin.triggerJobSync.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const handleDeleteJob = (jobId: string) => {
        if (confirm("Are you sure you want to delete this job?")) {
            deleteJobMutation.mutate({ jobId });
        }
    };

    const handleCreateJob = () => {
        if (!newJob.job_title || !newJob.employer_name) {
            toast.error("Job title and employer name are required");
            return;
        }
        createJobMutation.mutate(newJob);
    };

    const handleTriggerSync = () => {
        if (confirm("This will trigger the job sync process. Continue?")) {
            triggerSyncMutation.mutate();
        }
    };

    if (isError) {
        return <div className="text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Input
                    placeholder="Search jobs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex gap-2">
                    <Button
                        onClick={handleTriggerSync}
                        disabled={triggerSyncMutation.isPending}
                        variant="outline"
                    >
                        {triggerSyncMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Trigger Job Sync
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New Job</DialogTitle>
                                <DialogDescription>
                                    Manually add a job listing to the database.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="job_title">Job Title *</Label>
                                    <Input
                                        id="job_title"
                                        value={newJob.job_title}
                                        onChange={(e) =>
                                            setNewJob({ ...newJob, job_title: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="employer_name">Employer Name *</Label>
                                    <Input
                                        id="employer_name"
                                        value={newJob.employer_name}
                                        onChange={(e) =>
                                            setNewJob({ ...newJob, employer_name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="job_location">Location</Label>
                                    <Input
                                        id="job_location"
                                        value={newJob.job_location}
                                        onChange={(e) =>
                                            setNewJob({ ...newJob, job_location: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="job_apply_link">Apply Link</Label>
                                    <Input
                                        id="job_apply_link"
                                        value={newJob.job_apply_link}
                                        onChange={(e) =>
                                            setNewJob({ ...newJob, job_apply_link: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="job_description">Description</Label>
                                    <Textarea
                                        id="job_description"
                                        value={newJob.job_description}
                                        onChange={(e) =>
                                            setNewJob({ ...newJob, job_description: e.target.value })
                                        }
                                        rows={4}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="job_is_remote"
                                        checked={newJob.job_is_remote}
                                        onCheckedChange={(checked) =>
                                            setNewJob({ ...newJob, job_is_remote: !!checked })
                                        }
                                    />
                                    <Label htmlFor="job_is_remote">Remote Position</Label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateJob}
                                    disabled={createJobMutation.isPending}
                                >
                                    {createJobMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create Job
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Employer</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Remote</TableHead>
                            <TableHead>Posted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : data?.jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">
                                        {job.job_title || "N/A"}
                                    </TableCell>
                                    <TableCell>{job.employer_name || "N/A"}</TableCell>
                                    <TableCell>{job.job_location || "N/A"}</TableCell>
                                    <TableCell>
                                        {job.job_is_remote ? (
                                            <Badge variant="secondary">Remote</Badge>
                                        ) : (
                                            <Badge variant="outline">On-site</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {job.created_at
                                            ? format(new Date(job.created_at), "MMM d, yyyy")
                                            : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteJob(job.id)}
                                            disabled={deleteJobMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
