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
import { CandidateFilterSidebar } from "./CandidateFilterSidebar";
import { Loader2, Mail, MessageSquare, Plus, MoreHorizontal, Trash, User, FileText, Filter, Activity, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        minScore: 0,
        status: [] as string[],
        hasResume: false
    });

    const { data: candidates, isLoading, refetch } = trpc.recruiter.getCandidates.useQuery({ recruiterJobId }, {
        refetchOnWindowFocus: false,
    });

    const filteredCandidates = candidates?.filter(c => {
        // Score Filter
        const scoreData = c.resume?.scoreData as { scores?: { overallScore?: number }; overallScore?: number } | null;
        const rawScore = scoreData?.scores?.overallScore ?? scoreData?.overallScore ?? 0;
        const score = rawScore <= 0 ? 0 : rawScore <= 1 ? rawScore * 100 : rawScore <= 10 ? rawScore * 10 : rawScore;
        if (score < filters.minScore) return false;

        // Status Filter
        if (filters.status.length > 0 && !filters.status.includes(c.status)) return false;

        // Resume Filter
        if (filters.hasResume && !c.resumeId) return false;

        return true;
    });

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
            <div className="flex-1 flex flex-col space-y-6">
                <div className="flex justify-between items-center pr-1">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-32" />
                </div>
                <div className="flex-1 bg-white/40 border border-indigo-100/40 rounded-2xl overflow-hidden p-6 space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-4 w-1/6" />
                    </div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex gap-6 overflow-hidden">
            <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                <div className="flex justify-between items-center pr-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={`h-9 gap-2 border-indigo-100 ${isFilterOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {(filters.minScore > 0 || filters.status.length > 0 || filters.hasResume) && (
                                <Badge className="h-5 w-5 p-0 justify-center bg-indigo-600 ml-1 rounded-full text-[10px]">
                                    {(filters.minScore > 0 ? 1 : 0) + (filters.status.length > 0 ? 1 : 0) + (filters.hasResume ? 1 : 0)}
                                </Badge>
                            )}
                        </Button>
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <span className="text-xs font-medium text-muted-foreground">
                            {filteredCandidates?.length} candidates
                        </span>
                    </div>
                    <AddCandidateDialog recruiterJobId={recruiterJobId} onSuccess={refetch} />
                </div>

                <div className="flex-1 bg-white/40 backdrop-blur-md border border-indigo-100/40 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <TableHead className="w-[250px] pl-6">Candidate</TableHead>
                                <TableHead>AI Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead>Resume</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCandidates?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm font-medium italic">
                                        No candidates found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCandidates?.map((candidate) => {
                                    const scoreData = candidate.resume?.scoreData as { scores?: { overallScore?: number }; overallScore?: number } | null;
                                    let matchScore = 0;
                                    const rawOverall = scoreData?.scores?.overallScore ?? scoreData?.overallScore ?? 0;
                                    if (rawOverall > 0) {
                                        matchScore = rawOverall <= 1 ? Math.round(rawOverall * 100) : rawOverall <= 10 ? Math.round(rawOverall * 10) : Math.round(rawOverall);
                                    }

                                    return (
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
                                                {candidate.resumeId ? (
                                                    matchScore > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={`
                                                                ${matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                    matchScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                        'bg-slate-50 text-slate-600 border-slate-200'} font-bold`
                                                            }>
                                                                {matchScore}%
                                                            </Badge>
                                                            {(candidate.resume?.analysisData || candidate.resume?.scoreData) && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="cursor-help text-indigo-400 hover:text-indigo-600 transition-colors">
                                                                                <Activity className="h-3.5 w-3.5" />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="p-0 border-none bg-transparent shadow-none" side="right">
                                                                            <Card className="w-64 border-indigo-100 shadow-xl rounded-xl overflow-hidden bg-white">
                                                                                <CardContent className="p-4 space-y-3">
                                                                                    <div className="flex items-center gap-2 border-b pb-2">
                                                                                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                                                        <span className="text-[10px] font-bold uppercase tracking-tight">AI Fit Summary</span>
                                                                                    </div>
                                                                                    {(() => {
                                                                                        const analysis = candidate.resume?.analysisData as any;
                                                                                        const scoreData = candidate.resume?.scoreData as any;
                                                                                        const recommendations = scoreData?.roleMatch?.recommendations || [];
                                                                                        const missingSkills = scoreData?.roleMatch?.missingSkills || [];

                                                                                        return (
                                                                                            <div className="space-y-3">
                                                                                                {recommendations.length > 0 && (
                                                                                                    <div className="space-y-1">
                                                                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Key Fit</p>
                                                                                                        <p className="text-[10px] leading-relaxed text-foreground/80">{recommendations[0]}</p>
                                                                                                    </div>
                                                                                                )}
                                                                                                {missingSkills.length > 0 && (
                                                                                                    <div className="space-y-1">
                                                                                                        <p className="text-[9px] font-bold text-rose-500/80 uppercase tracking-widest">Gaps</p>
                                                                                                        <div className="flex flex-wrap gap-1">
                                                                                                            {missingSkills.slice(0, 3).map((s: string) => (
                                                                                                                <Badge key={s} variant="outline" className="text-[8px] px-1.5 py-0 bg-rose-50 border-rose-100 text-rose-600">{s}</Badge>
                                                                                                            ))}
                                                                                                            {missingSkills.length > 3 && <span className="text-[8px] text-muted-foreground">+{missingSkills.length - 3} more</span>}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                                {(!recommendations.length && !missingSkills.length) && (
                                                                                                    <div className="space-y-1">
                                                                                                        <p className="text-[9px] font-bold text-indigo-500/80 uppercase tracking-widest">Analysis</p>
                                                                                                        <p className="text-[10px] italic text-muted-foreground">Detailed match analysis is available in the resume preview.</p>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </CardContent>
                                                                            </Card>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground/40 italic">Pending</span>
                                                    )
                                                ) : <span className="text-[10px] text-muted-foreground/40">-</span>}
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                                                    asChild
                                                                >
                                                                    <a href={`mailto:${candidate.candidateEmail}`}>
                                                                        <Mail className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider">Email Candidate</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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

            <CandidateFilterSidebar
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                counts={{
                    total: candidates?.length || 0,
                    filtered: filteredCandidates?.length || 0
                }}
            />
        </div>
    );
}
