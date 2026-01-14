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
import { Loader2, Mail, Clock, MessageSquare, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const PIPELINE_STAGES = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { id: 'REVIEWING', label: 'Reviewing', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
    { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
    { id: 'INTERVIEWED', label: 'Interviewed', color: 'bg-violet-500', bgColor: 'bg-violet-50' },
    { id: 'OFFERED', label: 'Offer Sent', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
    { id: 'HIRED', label: 'Hired', color: 'bg-green-600', bgColor: 'bg-green-50' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-500', bgColor: 'bg-rose-50' },
];

export function CandidatePipelineBoard({ recruiterJobId }: { recruiterJobId: string }) {
    const { data: candidates, isLoading, refetch } = trpc.recruiter.getCandidates.useQuery({ recruiterJobId });

    const updateStatusMutation = trpc.recruiter.updateCandidateStatus.useMutation({
        onSuccess: () => {
            toast.success("Status updated");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

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
                        <div key={stage.id} className="w-[320px] flex flex-col h-full bg-slate-50/50 rounded-2xl border p-2">
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
                                    <Card key={candidate.id} className="shadow-none border hover:border-primary/30 transition-colors rounded-xl overflow-hidden group">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                                        <AvatarFallback className="bg-slate-100 text-[10px] font-bold">
                                                            {candidate.candidateName.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-xs truncate" title={candidate.candidateName}>
                                                            {candidate.candidateName}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {formatDistanceToNow(new Date(candidate.appliedAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 break-all px-1">
                                                <Mail className="h-3 w-3 flex-shrink-0 opacity-40" />
                                                <span className="truncate">{candidate.candidateEmail}</span>
                                            </div>

                                            {candidate.notes && (
                                                <div className="bg-muted/30 p-2.5 rounded-lg text-[10px] text-muted-foreground leading-relaxed border border-transparent group-hover:border-border/50 transition-colors">
                                                    <MessageSquare className="h-2.5 w-2.5 inline mr-1.5 opacity-40" />
                                                    {candidate.notes}
                                                </div>
                                            )}

                                            <div className="pt-3 border-t mt-1">
                                                <Select
                                                    defaultValue={candidate.status}
                                                    onValueChange={(val) =>
                                                        updateStatusMutation.mutate({
                                                            candidateId: candidate.id,
                                                            status: val as any
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-7 text-[10px] font-bold w-full rounded-lg border-none bg-muted/50 hover:bg-muted transition-colors px-2">
                                                        <SelectValue placeholder="Move to..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border/50 shadow-xl p-1">
                                                        {PIPELINE_STAGES.map((s) => (
                                                            <SelectItem key={s.id} value={s.id} className="rounded-lg py-1.5 text-xs font-medium cursor-pointer">
                                                                {s.label}
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
