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
import { Label } from "@/components/ui/label";
import { Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ImageKitUpload } from "@/components/ui/ImageKitUpload";

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

export function AddCandidateDialog({ recruiterJobId, onSuccess }: AddCandidateDialogProps) {
    const [open, setOpen] = useState(false);

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
            onSuccess();
        },
        onError: (error) => toast.error(error.message),
    });

    const onSubmit = (values: z.infer<typeof candidateSchema>) => {
        createMutation.mutate({
            recruiterJobId,
            ...values,
            resumeId: values.resumeId || undefined,
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
                                        <Input placeholder="John Doe" {...field} />
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
                                        <Input placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="resumeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resume (Optional)</FormLabel>
                                    <FormControl>
                                        <ImageKitUpload
                                            value={field.value}
                                            onSuccess={(url) => field.onChange(url)}
                                            onClear={() => field.onChange("")}
                                            buttonText="Upload Resume"
                                            folder="/manual-resumes"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">
                                        Upload the candidate's CV or resume.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Initial Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notes about the candidate..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Candidate
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
