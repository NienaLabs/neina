"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

const candidateSchema = z.object({
    candidateName: z.string().min(1, "Name is required"),
    candidateEmail: z.string().email("Invalid email"),
    resumeId: z.string().optional().or(z.literal('')),
    notes: z.string().optional(),
});

interface AddCandidateDialogProps {
    recruiterJobId: string;
    onSuccess: () => void;
}

/**
 * AddCandidateDialog Component
 * 
 * Provides a form-based modal for recruiters to manually add candidates to a job pipeline.
 * Includes fields for name, email, resume upload, and initial notes.
 * 
 * @param {string} props.recruiterJobId - The ID of the job this candidate is being added to.
 * @param {Function} props.onSuccess - Callback triggered after successful candidate creation.
 */
export function AddCandidateDialog({ recruiterJobId, onSuccess }: AddCandidateDialogProps) {
    const [open, setOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
    const utils = trpc.useUtils();

    const form = useForm<z.infer<typeof candidateSchema>>({
        resolver: zodResolver(candidateSchema),
        defaultValues: {
            candidateName: "",
            candidateEmail: "",
            resumeId: "",
            notes: "",
        },
    });

    const createMutation = trpc.recruiter.addCandidate.useMutation({
        onSuccess: () => {
            toast.success("Candidate added successfully");
            setOpen(false);
            form.reset();
            setUploadedResumeName(null);
            setIsAIProcessing(false);
            onSuccess();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file");
            return;
        }

        setIsParsing(true);
        setIsAIProcessing(false);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/parse-pdf", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                form.setValue("resumeId", data.resumeId);
                setUploadedResumeName(file.name);
                toast.success("Resume text extracted");

                // Start polling for AI Analysis completion
                setIsAIProcessing(true);
                const poll = async () => {
                    try {
                        const resume = await utils.resume.getUnique.fetch({ resumeId: data.resumeId });
                        if (resume && (resume.status === "COMPLETED" || resume.status === "FAILED")) {
                            setIsAIProcessing(false);
                            if (resume.status === "COMPLETED") {
                                toast.success("AI Analysis ready");
                            } else {
                                toast.error("AI Analysis failed, but resume text saved");
                            }
                        } else {
                            setTimeout(poll, 2000);
                        }
                    } catch (err) {
                        console.error("Poll error:", err);
                        setIsAIProcessing(false);
                    }
                };
                poll();
            } else {
                toast.error(data.message || "Failed to parse resume");
            }
        } catch (error) {
            console.error("Parse error:", error);
            toast.error("An error occurred while parsing the resume");
        } finally {
            setIsParsing(false);
        }
    };

    const onSubmit = (values: z.infer<typeof candidateSchema>) => {
        createMutation.mutate({
            recruiterJobId,
            ...values,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Candidate
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Candidate Manually</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="candidateName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" disabled={isParsing} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="candidateEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" disabled={isParsing} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Resume (PDF)</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        disabled={isParsing || isAIProcessing}
                                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {(isParsing || isAIProcessing) && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {isParsing ? "Extracting text..." : "AI Match Scoring in progress..."}
                                        </div>
                                    )}
                                    {uploadedResumeName && !isParsing && !isAIProcessing && (
                                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                            <FileText className="h-3 w-3" />
                                            {uploadedResumeName} processed & ready
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Full AI Analysis (keywords & skills) is required before adding.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Initial Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notes about the candidate..." disabled={isParsing || isAIProcessing} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={createMutation.isPending || isParsing || isAIProcessing}>
                                {(createMutation.isPending || isParsing || isAIProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isAIProcessing ? "AI Analysis..." : "Add Candidate"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
