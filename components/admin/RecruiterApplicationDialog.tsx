"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Check,
    X,
    Building2,
    User,
    Mail,
    Phone,
    Linkedin,
    Eye,
    Globe,
    MessageSquare,
    Briefcase,
    FileText,
    ExternalLink
} from "lucide-react";
import { ImageKitProvider } from "@imagekit/next";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface RecruiterApplicationDialogProps {
    application: any;
    onUpdate: () => void;
}

export function RecruiterApplicationDialog({ application, onUpdate }: RecruiterApplicationDialogProps) {
    const [open, setOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    const approveMutation = trpc.admin.approveRecruiterApplication.useMutation({
        onSuccess: () => {
            toast.success("Recruiter verified successfully");
            setOpen(false);
            onUpdate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const rejectMutation = trpc.admin.rejectRecruiterApplication.useMutation({
        onSuccess: () => {
            toast.success("Application rejected");
            setOpen(false);
            setShowRejectForm(false);
            setRejectionReason("");
            onUpdate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleApprove = () => {
        approveMutation.mutate({ applicationId: application.id });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        rejectMutation.mutate({
            applicationId: application.id,
            reason: rejectionReason
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">Recruiter Application</DialogTitle>
                        <StatusBadge status={application.status} />
                    </div>
                    <DialogDescription>
                        Submitted on {new Date(application.createdAt).toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* User Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-primary">
                            <User className="h-4 w-4" /> Applicant Information
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={application.user.image || ""} />
                                    <AvatarFallback>{application.user.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{application.user.name}</p>
                                    <p className="text-xs text-muted-foreground">Applicant Account</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-[20px_1fr] gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{application.email}</span>

                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{application.phoneNumber}</span>

                                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{application.position}</span>

                                <Linkedin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                {application.linkedInProfile ? (
                                    <a href={application.linkedInProfile} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">
                                        LinkedIn Profile
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground italic">Not provided</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-primary">
                            <Building2 className="h-4 w-4" /> Company Information
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-[20px_1fr] gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span className="font-medium">{application.companyName}</span>

                                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                                {application.companyWebsite ? (
                                    <a href={application.companyWebsite} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">
                                        {application.companyWebsite}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground italic">Not provided</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Verification Documents */}
                    <div className="md:col-span-2 space-y-2">
                        <h3 className="font-semibold flex items-center gap-2 text-primary">
                            <FileText className="h-4 w-4" /> Verification Documents
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            {application.verificationDocuments ? (
                                <ImageKitProvider urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="truncate max-w-md">{application.verificationDocuments.split('/').pop()}</span>
                                            <a
                                                href={application.verificationDocuments}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto flex items-center gap-1 text-primary hover:underline"
                                            >
                                                Open Original <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>

                                        {/* Image Preview */}
                                        <div className="relative rounded-md overflow-hidden border bg-background/50 flex justify-center p-2">
                                            {application.verificationDocuments.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) ? (
                                                <img
                                                    src={application.verificationDocuments}
                                                    width={600}
                                                    height={400}
                                                    alt="Verification Document"
                                                    className="max-h-[300px] w-auto object-contain rounded-md"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground gap-2 w-full">
                                                    <FileText className="h-10 w-10 opacity-50" />
                                                    <span>Preview not available for this file type</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ImageKitProvider>
                            ) : (
                                <span className="text-muted-foreground italic text-sm">No verification documents provided</span>
                            )}
                        </div>
                    </div>

                    {/* Message - Full Width */}
                    <div className="md:col-span-2 space-y-2">
                        <h3 className="font-semibold flex items-center gap-2 text-primary">
                            <MessageSquare className="h-4 w-4" /> Application Message
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                            {application.message}
                        </div>
                    </div>

                    {/* Rejection Info (if applicable) */}
                    {application.status === 'REJECTED' && application.rejectionReason && (
                        <div className="md:col-span-2 space-y-2">
                            <h3 className="font-semibold flex items-center gap-2 text-red-500">
                                <X className="h-4 w-4" /> Rejection Reason
                            </h3>
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-4 rounded-lg text-sm text-red-800 dark:text-red-200">
                                {application.rejectionReason}
                            </div>
                        </div>
                    )}
                </div>

                {application.status === 'PENDING' && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        {showRejectForm ? (
                            <div className="w-full space-y-3">
                                <Label htmlFor="reason">Reason for rejection:</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please explain why the application is being rejected..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setShowRejectForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={rejectMutation.isPending}
                                    >
                                        {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowRejectForm(true)}
                                >
                                    <X className="mr-2 h-4 w-4" /> Reject Application
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="mr-2 h-4 w-4" /> Verify & Approve
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
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
