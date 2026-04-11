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
    const utils = trpc.useUtils();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [resumeId, setResumeId] = useState<string>("");
    const [coverLetter, setCoverLetter] = useState("");
    const [uploadMode, setUploadMode] = useState<"select" | "upload">("select");
    const [isParsing, setIsParsing] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    // Effect to pre-fill data when user loads
    useEffect(() => {
        if (user) {
            setFullName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    const { data: job, isLoading: isLoadingJob } = trpc.jobs.getJob.useQuery({ id: jobId });
    const { data: resumes, isLoading: isLoadingResumes } = trpc.resume.getPrimaryResumes.useQuery();

    // Default to upload mode if no resumes exist
    useEffect(() => {
        if (!isLoadingResumes && (!resumes || resumes.length === 0)) {
            setUploadMode("upload");
        }
    }, [resumes, isLoadingResumes]);

    const submitMutation = trpc.jobs.submitApplication.useMutation({
        onSuccess: () => {
            toast.success("Application submitted successfully!");
            router.push(`/jobs/${jobId}`);
        },
        onError: (error) => toast.error(error.message),
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file");
            return;
        }

        setIsParsing(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/parse-pdf", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setResumeId(data.resumeId);
                setUploadedFile(file.name);
                toast.success("Resume uploaded and parsed!");
                // Refresh resumes list in the background
                utils.resume.getPrimaryResumes.invalidate();
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
            toast.error("Please provide a resume");
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
                                    <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        placeholder="John Doe"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="john@example.com"
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Resume</Label>
                                    {resumes && resumes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadMode(uploadMode === "select" ? "upload" : "select");
                                                if (uploadMode === "select") setResumeId(""); // Reset if switching to upload
                                            }}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            {uploadMode === "select" ? "Upload new instead" : "Select from saved"}
                                        </button>
                                    )}
                                </div>

                                {uploadMode === "select" && resumes && resumes.length > 0 ? (
                                    <Select value={resumeId} onValueChange={setResumeId}>
                                        <SelectTrigger className="h-11">
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
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            id="resume-upload"
                                            onChange={handleFileUpload}
                                            disabled={isParsing}
                                        />
                                        <label
                                            htmlFor="resume-upload"
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-primary/5 hover:border-primary/50 relative ${uploadedFile ? 'bg-primary/5 border-primary/50' : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
                                                }`}
                                        >
                                            {isParsing ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <span className="text-sm font-medium">Processing Resume...</span>
                                                </div>
                                            ) : uploadedFile ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="bg-primary/10 p-2 rounded-full">
                                                        <Upload className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-semibold">{uploadedFile}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Click to change</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Click to upload resume (PDF)</span>
                                                    <span className="text-xs text-muted-foreground">Max 5MB</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="coverLetter" className="text-sm font-semibold">Cover Letter (Optional)</Label>
                                <Textarea
                                    id="coverLetter"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Tell us why you're a great fit..."
                                    className="min-h-[150px] resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                                size="lg"
                                disabled={submitMutation.isPending || isParsing}
                            >
                                {submitMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : "Submit Application"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
