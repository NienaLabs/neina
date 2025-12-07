/**
 * ErrorsTable Component
 * 
 * Displays Sentry errors in a table format with status, count, and links.
 */

"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface SentryIssue {
    id: string;
    title: string;
    status: string;
    count: string;
    lastSeen: string;
    permalink: string;
    level: string;
}

interface ErrorsTableProps {
    issues: SentryIssue[] | undefined;
    isLoading: boolean;
}

export function ErrorsTable({ issues, isLoading }: ErrorsTableProps) {
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

    const filteredIssues = issues?.filter(issue => {
        if (filter === 'all') return true;
        return issue.status === filter;
    });

    const getStatusBadge = (status: string) => {
        if (status === 'resolved') {
            return (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Resolved
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="mr-1 h-3 w-3" />
                Unresolved
            </Badge>
        );
    };

    const getLevelBadge = (level: string) => {
        const colors: Record<string, string> = {
            error: 'bg-red-100 text-red-800',
            warning: 'bg-yellow-100 text-yellow-800',
            info: 'bg-blue-100 text-blue-800',
        };

        return (
            <Badge variant="outline" className={colors[level] || 'bg-gray-100 text-gray-800'}>
                {level}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading errors...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All ({issues?.length || 0})
                </Button>
                <Button
                    variant={filter === 'unresolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unresolved')}
                >
                    Unresolved ({issues?.filter(i => i.status === 'unresolved').length || 0})
                </Button>
                <Button
                    variant={filter === 'resolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('resolved')}
                >
                    Resolved ({issues?.filter(i => i.status === 'resolved').length || 0})
                </Button>
            </div>

            {/* Errors Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Error</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Count</TableHead>
                            <TableHead>Last Seen</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredIssues?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No errors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredIssues?.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-medium max-w-md">
                                        <div className="truncate" title={issue.title}>
                                            {issue.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getLevelBadge(issue.level)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(issue.status)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{issue.count}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(issue.lastSeen), "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={issue.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
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
