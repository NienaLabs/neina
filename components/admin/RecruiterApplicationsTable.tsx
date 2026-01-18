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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import { RecruiterApplicationDialog } from "./RecruiterApplicationDialog";

interface RecruiterApplicationsTableProps {
    applications: any[]; // Using any because of the include relation, can be typed better
    onUpdate: () => void;
}

export function RecruiterApplicationsTable({ applications, onUpdate }: RecruiterApplicationsTableProps) {
    if (applications.length === 0) {
        return (
            <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-muted-foreground">No applications found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={app.user.image || ""} />
                                        <AvatarFallback>{app.user.name?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{app.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{app.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{app.companyName}</span>
                                    {app.companyWebsite && (
                                        <a
                                            href={app.companyWebsite}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            Website <ExternalLink className="h-2 w-2" />
                                        </a>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{app.position}</TableCell>
                            <TableCell>
                                <StatusBadge status={app.status} />
                            </TableCell>
                            <TableCell>
                                {app.verificationType === 'MANUAL' ? (
                                    <Badge variant="outline" className="border-slate-400 text-slate-500">Manual</Badge>
                                ) : (
                                    <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">Application</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                {format(new Date(app.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <RecruiterApplicationDialog application={app} onUpdate={onUpdate} />
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
        case "APPROVED":
            return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
        case "REJECTED":
            return <Badge variant="destructive">Rejected</Badge>;
        case "PENDING":
        default:
            return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25">Pending</Badge>;
    }
}
