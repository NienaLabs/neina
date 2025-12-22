"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ImageKitUpload } from "@/components/ui/ImageKitUpload";

const jobSchema = z.object({
    job_title: z.string().min(1, 'Job title is required'),
    employer_name: z.string().min(1, 'Employer name is required'),
    job_location: z.string(),
    job_description: z.string(),
    job_apply_link: z.string().url('Invalid URL').min(1, 'Application link is required'),
    job_is_remote: z.boolean(),
    job_certifications: z.array(z.string()),
    qualifications: z.array(z.string()),
    responsibilities: z.array(z.string()),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface RecruiterJobFormProps {
    initialData?: any; // recruiterJob type
    recruiterJobId?: string;
}

export function RecruiterJobForm({ initialData, recruiterJobId }: RecruiterJobFormProps) {
    const router = useRouter();
    const isEditing = !!initialData;

    const createMutation = trpc.recruiter.createJob.useMutation({
        onSuccess: () => {
            toast.success("Job posted successfully!");
            router.push("/recruiters/jobs");
            router.refresh();
        },
        onError: (error) => toast.error(error.message),
    });

    const updateMutation = trpc.recruiter.updateJob.useMutation({
        onSuccess: () => {
            toast.success("Job updated successfully!");
            router.push("/recruiters/jobs");
            router.refresh();
        },
        onError: (error) => toast.error(error.message),
    });

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            job_title: "",
            employer_name: "",
            job_location: "",
            job_description: "",
            job_certifications: [],
            job_apply_link: "",
            job_is_remote: false,
            qualifications: [],
            responsibilities: [],
        },
    });

    useEffect(() => {
        if (initialData && initialData.job) {
            form.reset({
                job_title: initialData.job.job_title || "",
                employer_name: initialData.job.employer_name || "",
                job_location: initialData.job.job_location || "",
                job_description: initialData.job.job_description || "",
                job_certifications: initialData.job.job_certifications || [],
                job_apply_link: initialData.job.job_apply_link || "",
                job_is_remote: initialData.job.job_is_remote || false,
                qualifications: initialData.job.qualifications || [],
                responsibilities: initialData.job.responsibilities || [],
            });
        }
    }, [initialData, form]);

    // Re-evaluating field array for string[].
    // Simplest approach: Textarea with line breaks? OR custom component.
    // Let's use simple string inputs managed by local state or standard usage. 
    // Actually, hook-form string array support is tricky. 
    // Let's assume qualifications is just a long text field for now? No, schema says array.
    // Let's change schema to accept string and split by newline? Easier for user.
    // But backend expects array. Transform in submit.

    function onSubmit(values: JobFormValues) {
        if (isEditing && recruiterJobId) {
            updateMutation.mutate({
                recruiterJobId,
                ...values,
                job_location: values.job_location || undefined,
                job_description: values.job_description || undefined,
                jobCertifications: values.job_certifications,
            });
        } else {
            createMutation.mutate({
                ...values,
                job_location: values.job_location || undefined,
                job_description: values.job_description || undefined,
                jobCertifications: values.job_certifications,
            });
        }
    }

    // Helper to manage array fields
    const ArrayInput = ({ name, label, placeholder }: { name: "qualifications" | "responsibilities", label: string, placeholder: string }) => {
        const values = form.watch(name) || [];

        const add = () => {
            const current = form.getValues(name) || [];
            form.setValue(name, [...current, ""]);
        };

        const remove = (index: number) => {
            const current = form.getValues(name) || [];
            form.setValue(name, current.filter((_, i) => i !== index));
        };

        const update = (index: number, val: string) => {
            const current = form.getValues(name) || [];
            const newArr = [...current];
            newArr[index] = val;
            form.setValue(name, newArr as any);
        };

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <FormLabel>{label}</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={add}>
                        <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                </div>
                {values.map((val, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            value={val}
                            onChange={(e) => update(index, e.target.value)}
                            placeholder={placeholder}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                ))}
                {values.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No items added yet.</p>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/recruiters/jobs" className="flex items-center text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Jobs
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? "Edit Job Posting" : "Post a New Job"}</CardTitle>
                    <CardDescription>
                        Fill in the details for your job posting. Active jobs will be visible to candidates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="job_title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Title *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="employer_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Employer / Company Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. TechCorp" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="job_location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. San Francisco, CA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="job_is_remote"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Remote Position
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Check this if the job is fully remote.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Application Link */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Application</h3>
                                <FormField
                                    control={form.control}
                                    name="job_apply_link"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>External Application Link *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://forms.google.com/..." {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Candidates will be redirected to this URL to apply. We will track clicks.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Details</h3>
                                <FormField
                                    control={form.control}
                                    name="job_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detailed description of the role..."
                                                    className="min-h-[150px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ArrayInput
                                        name="qualifications"
                                        label="Qualifications (Requirements)"
                                        placeholder="e.g. 5+ years React experience"
                                    />
                                    <ArrayInput
                                        name="responsibilities"
                                        label="Responsibilities"
                                        placeholder="e.g. Lead frontend architecture"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {isEditing
                                        ? (updateMutation.isPending ? "Updating..." : "Update Job")
                                        : (createMutation.isPending ? "Posting..." : "Post Job")
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
