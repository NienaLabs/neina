"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { AddCandidateDialog } from "./AddCandidateDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, Mail, Clock, MessageSquare, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const PIPELINE_STAGES = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500/10 text-blue-500 border-blue-200' },
    { id: 'REVIEWING', label: 'Reviewing', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-200' },
    { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-purple-500/10 text-purple-500 border-purple-200' },
    { id: 'INTERVIEWED', label: 'Interviewed', color: 'bg-orange-500/10 text-orange-500 border-orange-200' },
    { id: 'OFFERED', label: 'Offer Sent', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-200' },
    { id: 'HIRED', label: 'Hired', color: 'bg-green-500/10 text-green-500 border-green-200' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-500/10 text-red-500 border-red-200' },
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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div className="space-y-6">
            <div className="flex justify-end">
                <AddCandidateDialog recruiterJobId={recruiterJobId} onSuccess={refetch} />
            </div>

            <div className="flex overflow-x-auto pb-6 gap-4 min-h-[calc(100vh-250px)]">
                {PIPELINE_STAGES.map((stage) => (
                    <div key={stage.id} className="min-w-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 h-full">
                        <div className={`flex items-center justify-between mb-4 px-2 py-1 rounded border ${stage.color}`}>
                            <span className="font-semibold text-sm">{stage.label}</span>
                            <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                                {groupedCandidates[stage.id]?.length || 0}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {groupedCandidates[stage.id]?.map((candidate) => (
                                <Card key={candidate.id} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {candidate.candidateName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm line-clamp-1" title={candidate.candidateName}>
                                                        {candidate.candidateName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(candidate.appliedAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 break-all">
                                            <Mail className="h-3 w-3 flex-shrink-0" />
                                            {candidate.candidateEmail}
                                        </div>

                                        {candidate.notes && (
                                            <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground line-clamp-2">
                                                <MessageSquare className="h-3 w-3 inline mr-1" />
                                                {candidate.notes}
                                            </div>
                                        )}

                                        <div className="pt-2 border-t mt-2">
                                            <Select
                                                defaultValue={candidate.status}
                                                onValueChange={(val) =>
                                                    updateStatusMutation.mutate({
                                                        candidateId: candidate.id,
                                                        status: val as any
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-7 text-xs w-full">
                                                    <SelectValue placeholder="Move to..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PIPELINE_STAGES.map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
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
                                <div className="text-center py-8 text-xs text-muted-foreground/50 border-2 border-dashed rounded-lg">
                                    No candidates
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
