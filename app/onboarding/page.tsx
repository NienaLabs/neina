"use client";

import { useState, useCallback, useRef, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  UserCircle,
  MapPin,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Rocket,
  Search,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { authClient } from "@/auth-client";

gsap.registerPlugin(useGSAP);

interface FormData {
  role: "seeker" | "recruiter" | "";
  goal: string;
  fullName: string;
  referralSource: string;
  jobTitle: string;
  experienceLevel: string;
  selectedTopics: string[];
  location: string;
  jobType: string;
  remotePreference: string;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const formContentRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    role: "",
    goal: "",
    fullName: "",
    referralSource: "",
    jobTitle: "",
    experienceLevel: "",
    selectedTopics: [],
    location: "",
    jobType: "Full-time",
    remotePreference: "Hybrid",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      toast.success("Profile updated successfully!");

      // If user selected recruiter, redirect to application page
      if (formData.role === "recruiter") {
        window.location.href = "/recruiters/apply";
      } else {
        // Job seekers go to dashboard
        window.location.href = "/dashboard";
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile. Please try again.");
      setIsSubmitting(false);
    }
  });

  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome",
      description: "How would you like to use Niena?",
      icon: Target,
    },
    {
      id: 2,
      title: "Details",
      description: "Tell us about yourself",
      icon: UserCircle,
    },
    {
      id: 3,
      title: "Interests",
      description: "What should we focus on?",
      icon: Sparkles,
    },
    {
      id: 4,
      title: "Preferences",
      description: "Your ideal opportunity",
      icon: MapPin,
    },
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (2-5 years)" },
    { value: "senior", label: "Senior Level (5+ years)" },
    { value: "executive", label: "Executive" },
  ];

  const referralOptions = [
    "LinkedIn",
    "Google",
    "Friend",
    "Social Media",
    "Other",
  ];

  const topicOptions = [
    "Software Engineering",
    "Data Science",
    "Marketing and Sales",
    "Human Resource Management",
    "Finance",
    "Project or Product Management",
    "AI/ML",
    "Cybersecurity",
  ];

  const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
  const remotePreferences = ["Remote", "Hybrid", "On-site"];

  const goals = [
    {
      id: "resume",
      title: "Resume Builder",
      description: "Create a job-winning resume.",
      icon: Rocket,
    },
    {
      id: "interview",
      title: "Interview Coach",
      description: "Practice with AI.",
      icon: Sparkles,
    },
    {
      id: "matching",
      title: "Job Matcher",
      description: "Find tailored jobs.",
      icon: Search,
    },
  ];

  useGSAP(() => {
    // Animate content entry when step changes
    gsap.fromTo(
      formContentRef.current,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
    );
  }, { dependencies: [currentStep], scope: containerRef });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTopic = (topic: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter((t) => t !== topic)
        : [...prev.selectedTopics, topic],
    }));
  };

  const handleNext = useCallback(async () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        await updateProfile.mutateAsync({
          role: formData.role || undefined,
          goal: formData.goal,
          referralSource: formData.referralSource,
          jobTitle: formData.jobTitle,
          experienceLevel: formData.experienceLevel,
          selectedTopics: formData.selectedTopics,
          location: formData.location,
          jobType: formData.jobType,
          remotePreference: formData.remotePreference,
        });
      } catch (err) {
        console.error("Onboarding submission error:", err);
      }
    }
  }, [currentStep, steps.length, formData, updateProfile]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: "seeker" }))}
                className={cn(
                  "p-5 rounded-2xl border transition-all flex flex-col items-center text-center gap-3 group relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900",
                  formData.role === "seeker"
                    ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white shadow-lg"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  formData.role === "seeker" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:scale-110"
                )}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Job Seeker</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Looking for opportunities
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: "recruiter" }))}
                className={cn(
                  "p-5 rounded-2xl border transition-all flex flex-col items-center text-center gap-3 group relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900",
                  formData.role === "recruiter"
                    ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white shadow-lg"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  formData.role === "recruiter" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:scale-110"
                )}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Recruiter</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Hiring top talent
                  </p>
                </div>
              </button>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Primary Goal</Label>
              <div className="flex flex-col gap-2.5">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, goal: goal.id }))}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all flex items-center gap-4 text-left hover:bg-white dark:hover:bg-zinc-900",
                      formData.goal === goal.id
                        ? "border-zinc-900 dark:border-white bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-900 dark:ring-white/50"
                        : "border-transparent bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform",
                      formData.goal === goal.id ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                    )}>
                      <goal.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{goal.title}</h4>
                      <p className="text-xs text-zinc-500 font-medium">{goal.description}</p>
                    </div>
                    {formData.goal === goal.id && (
                      <Check className="w-4 h-4 ml-auto text-zinc-900 dark:text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Sarah Smith"
                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-sm font-medium"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Referral Source</Label>
              <div className="flex flex-wrap gap-2">
                {referralOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectChange("referralSource", option)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-xs font-semibold transition-all shadow-sm",
                      formData.referralSource === option
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Recent Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Product Designer"
                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Experience</Label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(val) => handleSelectChange("experienceLevel", val)}
              >
                <SelectTrigger className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-sm font-medium">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value} className="text-sm rounded-lg cursor-pointer">
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Interests</Label>
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-1">
                {topicOptions.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5",
                      formData.selectedTopics.includes(topic)
                        ? "border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                        : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    {topic}
                    {formData.selectedTopics.includes(topic) && (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Job Type</Label>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectChange("jobType", type)}
                    className={cn(
                      "px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all",
                      formData.jobType === type
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Work Setup</Label>
              <div className="grid grid-cols-3 gap-3">
                {remotePreferences.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => handleSelectChange("remotePreference", pref)}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-semibold transition-all text-center",
                      formData.remotePreference === pref
                        ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm"
                        : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Preferred Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., London, UK"
                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-sm font-medium"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.role !== "" && formData.goal !== "";
      case 2:
        return formData.fullName.trim().length > 2 && formData.referralSource !== "";
      case 3:
        return formData.jobTitle.trim().length > 2 &&
          formData.experienceLevel !== "" &&
          formData.selectedTopics.length > 0;
      case 4:
        return formData.location.trim().length > 2;
      default:
        return true;
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 text-zinc-900 dark:text-zinc-100">

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/50 dark:shadow-zinc-950/50 overflow-hidden flex flex-col min-h-[580px]">

          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      step <= currentStep
                        ? "w-8 bg-zinc-900 dark:bg-white"
                        : "w-2 bg-zinc-200 dark:bg-zinc-800"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                Step {currentStep}/4
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {steps[currentStep - 1].title}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-8 py-2 overflow-y-auto" ref={formContentRef}>
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between mt-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="pl-2 pr-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className={cn(
                "rounded-xl px-6 h-10 font-semibold transition-all shadow-lg shadow-zinc-200 dark:shadow-zinc-950",
                "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
                "disabled:opacity-50 disabled:shadow-none"
              )}
            >
              {isSubmitting ? (
                "Setting up..."
              ) : currentStep === steps.length ? (
                <>
                  Complete <Rocket className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6 font-medium">
          Niena • AI Powered Career Elevator
        </p>
      </div>
    </div>
  );
}
