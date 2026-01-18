"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { AddCandidateDialog } from "./AddCandidateDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Loader2, Mail, Clock, MessageSquare, Plus, MoreHorizontal, Trash, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const PIPELINE_STAGES = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { id: 'REVIEWING', label: 'Reviewing', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
    { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
    { id: 'INTERVIEWED', label: 'Interviewed', color: 'bg-violet-500', bgColor: 'bg-violet-50' },
    { id: 'OFFERED', label: 'Offer Sent', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
    { id: 'HIRED', label: 'Hired', color: 'bg-green-600', bgColor: 'bg-green-50' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-500', bgColor: 'bg-rose-50' },
];

/**
 * CandidatePipelineBoard Component
 * 
 * Renders the candidate pipeline board for a given job, allowing recruiters
 * to visualize and manage candidates across different stages of the recruitment process.
 * 
 * @param {string} props.recruiterJobId - The ID of the recruiter job to fetch candidates for.
 * @returns {JSX.Element} The rendered candidate pipeline board.
 * 
 * @behavior
 * - Fetches candidates using TRPC query based on `recruiterJobId`.
 * - Groups candidates by their current status.
 * - Allows updating candidate status via a controlled Select component.
 * - Re-fetches data on successful status update.
 * 
 * @example
 * <CandidatePipelineBoard recruiterJobId="job-123" />
 */
export function CandidatePipelineBoard({ recruiterJobId }: { recruiterJobId: string }) {
    const { data: candidates, isLoading, refetch } = trpc.recruiter.getCandidates.useQuery({ recruiterJobId });

    const updateStatusMutation = trpc.recruiter.updateCandidateStatus.useMutation({
        onSuccess: () => {
            toast.success("Status updated");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = trpc.recruiter.deleteCandidate.useMutation({
        onSuccess: () => {
            toast.success("Candidate removed");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this candidate?")) {
            deleteMutation.mutate({ candidateId: id });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground opacity-30" />
            </div>
        );
    }

    const groupedCandidates = candidates?.reduce((acc, candidate) => {
        const status = candidate.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(candidate);
        return acc;
    }, {} as Record<string, typeof candidates>) || {};

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-end pr-4">
                <AddCandidateDialog recruiterJobId={recruiterJobId} onSuccess={refetch} />
            </div>

            <div className="flex-1 overflow-x-auto pb-6 -mx-2">
                <div className="flex gap-6 h-full px-2 min-w-max">
                    {PIPELINE_STAGES.map((stage) => (
                        <div key={stage.id} className="w-[320px] flex flex-col h-full bg-white/40 backdrop-blur-md border border-indigo-100/40 rounded-2xl p-2 shadow-sm">
                            <div className="flex items-center justify-between mb-4 px-3 pt-2 pb-1">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                                    <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{stage.label}</span>
                                </div>
                                <Badge variant="secondary" className="rounded-md text-[10px] font-bold px-1.5 py-0 h-4 bg-white shadow-sm border">
                                    {groupedCandidates[stage.id]?.length || 0}
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 px-1 no-scrollbar pb-4">
                                {groupedCandidates[stage.id]?.map((candidate) => (
                                    <Card key={candidate.id} className="shadow-sm border-indigo-100/50 hover:border-indigo-300 hover:shadow-md transition-all rounded-xl overflow-hidden group bg-white/90 backdrop-blur-sm">
                                        <CardContent className="p-4 space-y-3">
                                            {/* Header: Avatar, Name, Menu */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 text-xs font-bold">
                                                            {candidate.candidateName.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-foreground truncate" title={candidate.candidateName}>
                                                            {candidate.candidateName}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {formatDistanceToNow(new Date(candidate.appliedAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1.5 text-muted-foreground hover:text-indigo-600">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                                        <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                                                            <User className="mr-2 h-3.5 w-3.5" /> View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(candidate.id)}
                                                            className="text-xs font-medium text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                        >
                                                            <Trash className="mr-2 h-3.5 w-3.5" /> Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Details Section */}
                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-transparent group-hover:border-indigo-100/50 transition-colors">
                                                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                                                    <span className="truncate font-medium">{candidate.candidateEmail}</span>
                                                </div>

                                                {candidate.notes && (
                                                    <div className="bg-amber-50/50 p-2.5 rounded-lg text-[10px] text-amber-700 leading-relaxed border border-amber-100/50">
                                                        <div className="flex items-start gap-1.5">
                                                            <MessageSquare className="h-3 w-3 mt-0.5 opacity-50 flex-shrink-0" />
                                                            <span className="line-clamp-2">{candidate.notes}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status Selector */}
                                            <div className="pt-2">
                                                <Select
                                                    value={candidate.status}
                                                    onValueChange={(val) => {
                                                        const stage = PIPELINE_STAGES.find(s => s.id === val);
                                                        const confirmChange = confirm(
                                                            `Are you sure you want to move ${candidate.candidateName} to ${stage?.label}? This will notify the candidate.`
                                                        );
                                                        if (confirmChange) {
                                                            updateStatusMutation.mutate({
                                                                candidateId: candidate.id,
                                                                status: val as any
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs font-semibold w-full rounded-lg border-indigo-100 bg-white/50 hover:bg-white hover:border-indigo-300 transition-all px-3 shadow-sm">
                                                        <SelectValue placeholder="Move to..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-indigo-100 shadow-xl p-1">
                                                        {PIPELINE_STAGES.map((s) => (
                                                            <SelectItem key={s.id} value={s.id} className="rounded-lg py-2 text-xs font-medium cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                                                                    {s.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {(!groupedCandidates[stage.id] || groupedCandidates[stage.id].length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-20 bg-muted/5 rounded-xl border-2 border-dashed mx-1">
                                        <Plus className="h-5 w-5 mb-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Empty Stage</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
