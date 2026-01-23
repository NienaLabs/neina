"use client";

import { trpc } from "@/trpc/client";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, AlertCircle } from "lucide-react";
import PDFPreviewPageClient from "@/components/resume/pdf/PDFPreviewPageClient";
import { ResumeExtraction } from "@/components/resume/editor/types";

interface ResumePreviewSheetProps {
    candidateId: string | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    candidateName: string;
}

/**
 * ResumePreviewSheet Component
 * 
 * Displays a side panel with the candidate's resume preview using PDFPreviewPageClient.
 */
export function ResumePreviewSheet({
    candidateId,
    isOpen,
    onOpenChange,
    candidateName,
}: ResumePreviewSheetProps) {
    const { data: resume, isLoading, error } = trpc.recruiter.getResumeForCandidate.useQuery(
        { candidateId: candidateId as string },
        { enabled: !!candidateId && isOpen }
    );

    const parsedData = resume?.extractedData
        ? (typeof resume.extractedData === 'string'
            ? JSON.parse(resume.extractedData)
            : resume.extractedData) as ResumeExtraction
        : null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50/50">
                <SheetHeader className="p-6 bg-white border-b shrink-0 shadow-sm">
                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        Resume: {candidateName}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 opacity-50" />
                            <p className="text-sm font-medium text-slate-400">Loading Resume...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="p-4 rounded-full bg-red-50 text-red-500">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Failed to Load Resume</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                                    {error.message || "We couldn't fetch the resume for this candidate at the moment."}
                                </p>
                            </div>
                        </div>
                    ) : parsedData ? (
                        <div className="h-full bg-white">
                            <PDFPreviewPageClient data={parsedData} fullName={resume.name} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                            <p className="text-sm font-medium text-slate-400 italic">No resume data found for this candidate.</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
