"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ApplicationPage() {
    const params = useParams();
    const router = useRouter();
    const { data: user } = trpc.user.getMe.useQuery();
    const jobId = params.id as string;

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    // Effect to pre-fill data when user loads
    useEffect(() => {
        if (user) {
            setFullName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);
    const [resumeId, setResumeId] = useState<string>("");
    const [coverLetter, setCoverLetter] = useState("");

    const { data: job, isLoading: isLoadingJob } = trpc.jobs.getJob.useQuery({ id: jobId });
    const { data: resumes, isLoading: isLoadingResumes } = trpc.resume.getPrimaryResumes.useQuery();

    const submitMutation = trpc.jobs.submitApplication.useMutation({
        onSuccess: () => {
            toast.success("Application submitted successfully!");
            router.push(`/jobs/${jobId}`);
        },
        onError: (error) => toast.error(error.message),
    });

    if (isLoadingJob || isLoadingResumes) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!job) {
        return <div>Job not found</div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!resumeId) {
            toast.error("Please select a resume");
            return;
        }

        submitMutation.mutate({
            jobId,
            fullName,
            email,
            resumeId,
            coverLetter,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Details
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Apply for {job.job_title}</h1>
                    <p className="text-muted-foreground">at {job.employer_name}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Application Form</CardTitle>
                        <CardDescription>
                            Review your details and attach your resume.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input 
                                        id="fullName" 
                                        value={fullName} 
                                        onChange={(e) => setFullName(e.target.value)} 
                                        required 
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input 
                                        id="email" 
                                        type="email"
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Resume</Label>
                                {resumes && resumes.length > 0 ? (
                                    <Select value={resumeId} onValueChange={setResumeId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a resume" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resumes.map((resume) => (
                                                <SelectItem key={resume.id} value={resume.id}>
                                                    {resume.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="rounded-md border border-dashed p-4 text-center">
                                        <p className="text-sm text-muted-foreground mb-2">No resumes found.</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            type="button"
                                            onClick={() => router.push("/dashboard/resume")}
                                        >
                                            Upload/Create Resume
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                                <Textarea 
                                    id="coverLetter" 
                                    value={coverLetter} 
                                    onChange={(e) => setCoverLetter(e.target.value)} 
                                    placeholder="Tell us why you're a great fit..."
                                    className="min-h-[150px]"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                size="lg"
                                disabled={submitMutation.isPending}
                            >
                                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
