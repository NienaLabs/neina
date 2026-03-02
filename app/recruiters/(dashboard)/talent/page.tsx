"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * TalentPoolPage Component
 * 
 * The main interface for the Global Talent Pool.
 * Aggregates and displays all candidates across all of a recruiter's active jobs.
 * Supports searching and direct contact actions.
 */
export default function TalentPoolPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: candidates, isLoading } = trpc.recruiter.getAllCandidates.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const filteredCandidates = candidates?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="border rounded-xl bg-white/40 overflow-hidden">
                    <div className="h-12 bg-slate-50/50 border-b flex items-center px-6 gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 border-b flex items-center px-6 gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold font-syne">Talent Pool</h1>
                <p className="text-muted-foreground">
                    View all candidates who have applied to your jobs.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9 bg-white/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl bg-white/40 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="pl-6">Candidate</TableHead>
                            <TableHead>Best Match</TableHead>
                            <TableHead>Applications</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidates?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                                    No candidates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCandidates?.map((candidate) => (
                                <TableRow key={candidate.email} className="hover:bg-indigo-50/10">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                                    {candidate.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{candidate.name}</span>
                                                <span className="text-xs text-muted-foreground">{candidate.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {candidate.bestMatch.score > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className={`w-fit ${candidate.bestMatch.score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    candidate.bestMatch.score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {candidate.bestMatch.score}% Match
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                    for {candidate.bestMatch.jobTitle}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No score data</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-sm">{candidate.applications.length} application(s)</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                Latest: {formatDistanceToNow(new Date(candidate.applications[0].appliedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600" asChild>
                                                <a href={`mailto:${candidate.email}`}>
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
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
