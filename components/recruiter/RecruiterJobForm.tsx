"use client";

import { useForm, useFieldArray, Control } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const jobSchema = z.object({
    job_title: z.string().min(1, 'Job title is required'),
    employer_name: z.string().min(1, 'Employer name is required'),
    job_location: z.string().min(1, 'Job location is required'),
    job_description: z.string().min(10, 'Job description must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    job_is_remote: z.boolean(),
    job_certifications: z.array(z.string()).optional(),
    qualifications: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface RecruiterJobFormProps {
    initialData?: any; // recruiterJob type
    recruiterJobId?: string;
}

const JOB_CATEGORIES = [
    "Software Development",
    "Design",
    "Marketing",
    "Sales",
    "Customer Support",
    "Product Management",
    "Finance",
    "Human Resources",
    "Operations",
    "Data Science",
    "Legal",
    "Other"
];

/**
 * ArrayInput Component handles dynamic string lists like Qualifications and Responsibilities.
 * Uses useFieldArray for stable input management and focus retention.
 */
const ArrayInput = ({ control, name, label, placeholder }: {
    control: Control<JobFormValues>,
    name: "qualifications" | "responsibilities" | "job_certifications",
    label: string,
    placeholder: string
}) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: name as never
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-1">
                    {label}
                </FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => (append as any)("")}>
                    <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-1">
                    <div className="flex gap-2">
                        <FormField
                            control={control}
                            name={`${name}.${index}` as any}
                            render={({ field: inputField }) => (
                                <FormControl>
                                    <Input
                                        {...inputField}
                                        placeholder={placeholder}
                                    />
                                </FormControl>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            ))}
            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No {label.toLowerCase()} added yet. Click "Add" to include some.</p>
            )}
        </div>
    );
};

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
            category: "",
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
                category: initialData.job.category?.replace(' jobs', '') || "",
                job_is_remote: initialData.job.job_is_remote || false,
                qualifications: initialData.job.qualifications || [],
                responsibilities: initialData.job.responsibilities || [],
            });
        }
    }, [initialData, form]);

    function onSubmit(values: JobFormValues) {
        if (isEditing && recruiterJobId) {
            updateMutation.mutate({
                recruiterJobId,
                ...values,
                category: `${values.category} jobs`,
                job_location: values.job_location || undefined,
                job_description: values.job_description || undefined,
                jobCertifications: values.job_certifications,
            });
        } else {
            createMutation.mutate({
                ...values,
                category: `${values.category} jobs`,
                job_location: values.job_location || undefined,
                job_description: values.job_description || undefined,
                jobCertifications: values.job_certifications,
            });
        }
    }

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
                        Fill in the details for your job posting. Platform jobs allow candidates to apply directly here.
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
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a job category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {JOB_CATEGORIES.map((category) => (
                                                            <SelectItem key={category} value={category}>
                                                                {category}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="job_location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location *</FormLabel>
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

                            {/* Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Details</h3>
                                <FormField
                                    control={form.control}
                                    name="job_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Description *</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detailed description of the role..."
                                                    className="min-h-[300px] font-mono text-sm leading-relaxed"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ArrayInput
                                        control={form.control}
                                        name="qualifications"
                                        label="Qualifications (Requirements)"
                                        placeholder="e.g. 5+ years React experience"
                                    />
                                    <ArrayInput
                                        control={form.control}
                                        name="responsibilities"
                                        label="Responsibilities"
                                        placeholder="e.g. Lead frontend architecture"
                                    />
                                </div>

                                <div className="mt-8">
                                    <ArrayInput
                                        control={form.control}
                                        name="job_certifications"
                                        label="Certifications"
                                        placeholder="e.g. AWS Certified Solutions Architect"
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
