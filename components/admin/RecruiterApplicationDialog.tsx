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
                    <Eye className="mr-2 h-3.5 w-3.5" /> Review
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                <AvatarImage src={application.user.image || ""} />
                                <AvatarFallback className="text-lg">{application.user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-xl font-bold">{application.user.name}</DialogTitle>
                                    <StatusBadge status={application.status} />
                                </div>
                                <DialogDescription className="sr-only">
                                    Review application details for {application.user.name} from {application.companyName}
                                </DialogDescription>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{application.position}</span>
                                    <span>at</span>
                                    <span className="font-medium text-foreground">{application.companyName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs pt-1">
                                    <a href={`mailto:${application.email}`} className="flex items-center gap-1 hover:underline text-muted-foreground hover:text-primary transition-colors">
                                        <Mail className="h-3 w-3" /> {application.email}
                                    </a>
                                    {application.companyWebsite && (
                                        <a href={application.companyWebsite} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-muted-foreground hover:text-primary transition-colors">
                                            <Globe className="h-3 w-3" /> Website
                                        </a>
                                    )}
                                    {application.linkedInProfile && (
                                        <a href={application.linkedInProfile} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-muted-foreground hover:text-primary transition-colors">
                                            <Linkedin className="h-3 w-3" /> LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right space-y-1">
                            <p>Submitted</p>
                            <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Verification Documents - Primary Content */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-primary" /> Verification Document
                            </h3>
                            {application.verificationDocuments && (
                                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                                    <a href={application.verificationDocuments} target="_blank" rel="noopener noreferrer">
                                        Open Original <ExternalLink className="ml-2 h-3 w-3" />
                                    </a>
                                </Button>
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/30 border rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center relative group">
                            {application.verificationDocuments ? (
                                <ImageKitProvider urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}>
                                    {application.verificationDocuments.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) ? (
                                        <img
                                            src={application.verificationDocuments}
                                            alt="Verification Document"
                                            className="max-h-[400px] w-auto object-contain"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
                                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <FileText className="h-8 w-8 opacity-50" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium">Document Preview Unavailable</p>
                                                <p className="text-sm opacity-70">{application.verificationDocuments.split('/').pop()}</p>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={application.verificationDocuments} target="_blank" rel="noopener noreferrer">
                                                    Download to View
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </ImageKitProvider>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground p-8">
                                    <FileText className="h-10 w-10 opacity-20" />
                                    <p>No verification documents uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Application Message */}
                        <div className="md:col-span-2 space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Message from Applicant
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed border-l-4 border-primary/20">
                                {application.message || <span className="text-muted-foreground italic">No message provided.</span>}
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" /> Contact Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Phone</p>
                                    <p className="font-medium">{application.phoneNumber}</p>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Verification Source</p>
                                    <Badge variant="outline" className="mt-1">
                                        {application.verificationType === 'MANUAL' ? 'Manual Assignment' : 'Application Form'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason Display */}
                    {application.status === 'REJECTED' && application.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg">
                            <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-1">
                                <X className="h-4 w-4" /> Rejection Reason
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-200">{application.rejectionReason}</p>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                {application.status === 'PENDING' && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-t flex flex-col sm:flex-row gap-4 justify-between items-center sticky bottom-0 z-10">
                        {showRejectForm ? (
                            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="reason" className="text-red-600 font-medium">Reason for Rejection</Label>
                                    <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)} className="h-auto py-0 px-2">Cancel</Button>
                                </div>
                                <Textarea
                                    id="reason"
                                    placeholder="Please explain why the application is being rejected..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[80px]"
                                    autoFocus
                                />
                                <div className="flex justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={rejectMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {rejectMutation.isPending ? "Processing..." : "Confirm Rejection"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-sm text-muted-foreground hidden sm:block">
                                    <span className="font-medium text-foreground">Action Required:</span> Review the documents above before verifying.
                                </div>
                                <div className="flex w-full sm:w-auto gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRejectForm(true)}
                                        className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={handleApprove}
                                        disabled={approveMutation.isPending}
                                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 w-[140px]"
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Verify
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
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
