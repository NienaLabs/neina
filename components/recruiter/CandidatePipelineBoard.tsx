"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { AddCandidateDialog } from "./AddCandidateDialog";
import { ResumePreviewSheet } from "./ResumePreviewSheet";
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
import { Loader2, Mail, MessageSquare, Plus, MoreHorizontal, Trash, User, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

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
    const [previewCandidate, setPreviewCandidate] = useState<{ id: string, name: string } | null>(null);
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

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-end pr-4">
                <AddCandidateDialog recruiterJobId={recruiterJobId} onSuccess={refetch} />
            </div>

            <div className="flex-1 bg-white/40 backdrop-blur-md border border-indigo-100/40 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <TableHead className="w-[250px] pl-6">Candidate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Applied</TableHead>
                            <TableHead>Resume</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm font-medium italic">
                                    No candidates found for this position.
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates?.map((candidate) => (
                                <TableRow key={candidate.id} className="group hover:bg-indigo-50/20 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 text-[10px] font-bold">
                                                    {candidate.candidateName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-sm text-foreground truncate">{candidate.candidateName}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium truncate">{candidate.candidateEmail}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-[180px]">
                                            <Select
                                                value={candidate.status}
                                                onValueChange={(val) => {
                                                    const stage = PIPELINE_STAGES.find(s => s.id === val);
                                                    if (confirm(`Move ${candidate.candidateName} to ${stage?.label}?`)) {
                                                        updateStatusMutation.mutate({
                                                            candidateId: candidate.id,
                                                            status: val as any
                                                        });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs font-semibold rounded-lg border-indigo-100 bg-white/50 hover:bg-white hover:border-indigo-300 transition-all px-3 shadow-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl p-1">
                                                    {PIPELINE_STAGES.map((s) => (
                                                        <SelectItem key={s.id} value={s.id} className="rounded-lg text-xs font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                                                                {s.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-medium whitespace-nowrap tabular-nums">
                                        {formatDistanceToNow(new Date(candidate.appliedAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        {candidate.resumeId ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                                            onClick={() => setPreviewCandidate({ id: candidate.id, name: candidate.candidateName })}
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider">View Resume</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <span className="text-[10px] font-medium text-muted-foreground/40 italic">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                {candidate.notes && (
                                                    <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => alert(candidate.notes)}>
                                                        <MessageSquare className="mr-2 h-3.5 w-3.5" /> View Notes
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(candidate.id)}
                                                    className="text-xs font-medium text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                >
                                                    <Trash className="mr-2 h-3.5 w-3.5" /> Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ResumePreviewSheet
                candidateId={previewCandidate?.id || null}
                candidateName={previewCandidate?.name || ""}
                isOpen={!!previewCandidate}
                onOpenChange={(open) => !open && setPreviewCandidate(null)}
            />
        </div>
    );
}
