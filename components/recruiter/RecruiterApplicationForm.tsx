"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useSession } from "@/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase, Phone, Linkedin, Globe, Upload, FileCheck } from "lucide-react";
import { ImageKitUpload } from "@/components/ui/ImageKitUpload";

const formSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    companyWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
    position: z.string().min(1, 'Position is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    linkedInProfile: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    verificationDocuments: z.string().min(1, 'Verification documents are required'),
    message: z.string().min(10, 'Please provide a message (minimum 10 characters)'),
});

export function RecruiterApplicationForm() {
    const router = useRouter();
    const { data: session } = useSession();

    const { mutate: apply, isPending } = trpc.recruiter.applyForRecruiter.useMutation({
        onSuccess: () => {
            toast.success("Application submitted successfully!");
            router.push("/dashboard?recruiter_application_sent=true");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: "",
            companyWebsite: "",
            position: "",
            phoneNumber: "",
            linkedInProfile: "",
            verificationDocuments: "",
            message: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!session) {
            localStorage.setItem("pending_recruiter_application", JSON.stringify(values));
            toast.info("Please sign in to complete your application");
            router.push("/auth/sign-in");
            return;
        }

        apply({
            ...values,
            companyWebsite: values.companyWebsite || undefined,
            linkedInProfile: values.linkedInProfile || undefined,
        });
    }

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center border-b bg-slate-50/50 dark:bg-slate-900/20 pb-8">
                <CardTitle className="text-2xl">Become a Recruiter</CardTitle>
                <CardDescription>
                    Join our platform to post jobs, find top talent, and manage your hiring pipeline.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-6 sm:px-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Company Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                <Building2 className="h-5 w-5" /> Company Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Inc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="companyWebsite"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-9" placeholder="https://acme.com" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Recruiter Details */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                <Briefcase className="h-5 w-5" /> Your Info
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Senior Recruiter" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-9" placeholder="+1 (555) 000-0000" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="linkedInProfile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>LinkedIn Profile</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Linkedin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" placeholder="https://linkedin.com/in/..." {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="verificationDocuments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Verification Documents <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <ImageKitUpload
                                                value={field.value}
                                                onSuccess={(url) => field.onChange(url)}
                                                onClear={() => field.onChange("")}
                                                buttonText="Upload Business Certificate / ID"
                                                folder="/recruiter-verifications"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Upload documents showing you are a legit company (e.g., Certificate of Incorporation).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Please tell us a bit about your recruiting needs..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full text-lg h-12" disabled={isPending}>
                                {isPending ? "Submitting..." : "Submit Application"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
