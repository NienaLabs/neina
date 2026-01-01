"use client";

import { useState, useCallback, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    onSuccess: async () => {
      toast.success("Profile updated successfully!");
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile. Please try again.");
      setIsSubmitting(false);
    }
  });

  const steps: Step[] = [
    {
      id: 1,
      title: "Your Identity",
      description: "How would you like to use Job AI today?",
      icon: Target,
    },
    {
      id: 2,
      title: "Personal Details",
      description: "Tell us a bit about yourself.",
      icon: UserCircle,
    },
    {
      id: 3,
      title: "Interests",
      description: "What topics should we focus on for you?",
      icon: Sparkles,
    },
    {
      id: 4,
      title: "Job Preferences",
      description: "Find your next big opportunity.",
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
    "Google Search",
    "Friend/Colleague",
    "Instagram",
    "Twitter (X)",
    "YouTube",
    "Other",
  ];

  const topicOptions = [
    "Software Engineering",
    "Product Management",
    "UI/UX Design",
    "Data Science",
    "Marketing",
    "Sales",
    "Human Resources",
    "Finance",
    "Project Management",
    "Machine Learning",
    "Cloud Architecture",
    "Cybersecurity",
    "Digital Marketing",
    "Content Creation",
    "Mobile Development",
  ];

  const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
  const remotePreferences = ["Remote", "Hybrid", "On-site"];

  const goals = [
    {
      id: "resume",
      title: "AI Resume Builder",
      description: "Create a job-winning resume with AI assistance.",
      icon: Rocket,
    },
    {
      id: "interview",
      title: "Interview Coach",
      description: "Practice interviews with our AI coach.",
      icon: Sparkles,
    },
    {
      id: "matching",
      title: "Smart Job Matcher",
      description: "Find jobs tailored to your skills and preferences.",
      icon: Search,
    },
  ];

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

  const currentStepData = steps.find((step) => step.id === currentStep)!;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: "seeker" }))}
                className={cn(
                  "p-6 md:p-8 rounded-3xl border-2 transition-all flex flex-col items-center text-center gap-4 md:gap-6 hover:shadow-2xl group relative overflow-hidden",
                  formData.role === "seeker"
                    ? "border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/10"
                    : "border-white/40 bg-white/20 hover:border-indigo-500/50"
                )}
              >
                <div className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                  formData.role === "seeker" ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white scale-110" : "bg-white/50 text-[#5A5A7A] group-hover:scale-105"
                )}>
                  <Users className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-[#2A2A4A] dark:text-white">Job Seeker</h3>
                  <p className="text-sm md:text-base text-[#5A5A7A] dark:text-muted-foreground mt-1.5 font-medium leading-tight">
                    I'm looking for my next dream job opportunity.
                  </p>
                </div>
                {formData.role === "seeker" && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: "recruiter" }))}
                className={cn(
                  "p-6 md:p-8 rounded-3xl border-2 transition-all flex flex-col items-center text-center gap-4 md:gap-6 hover:shadow-2xl group relative overflow-hidden",
                  formData.role === "recruiter"
                    ? "border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/10"
                    : "border-white/40 bg-white/20 hover:border-blue-500/50"
                )}
              >
                <div className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                  formData.role === "recruiter" ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110" : "bg-white/50 text-[#5A5A7A] group-hover:scale-105"
                )}>
                  <Building2 className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-[#2A2A4A] dark:text-white">Recruiter</h3>
                  <p className="text-sm md:text-base text-[#5A5A7A] dark:text-muted-foreground mt-1.5 font-medium leading-tight">
                    I'm looking to hire top talent for my company.
                  </p>
                </div>
                {formData.role === "recruiter" && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              <Label className="text-lg md:text-xl font-black text-[#2A2A4A] dark:text-white block px-1">What is your primary goal?</Label>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, goal: goal.id }))}
                    className={cn(
                      "p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 md:gap-6 text-left hover:shadow-lg relative py-5",
                      formData.goal === goal.id
                        ? "border-indigo-500 bg-indigo-500/5"
                        : "border-white/40 bg-white/20 hover:border-indigo-500/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 md:w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform shadow-md",
                      formData.goal === goal.id ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white scale-105" : "bg-white/60 text-[#5A5A7A]"
                    )}>
                      <goal.icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white">{goal.title}</h4>
                      <p className="text-xs md:text-sm text-[#5A5A7A] dark:text-muted-foreground font-medium">{goal.description}</p>
                    </div>
                    {formData.goal === goal.id && (
                      <div className="ml-auto w-6 h-6 md:w-7 md:h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="h-12 md:h-14 text-base md:text-lg rounded-2xl bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm font-medium"
                autoFocus
              />
            </div>

            <div className="space-y-4 md:space-y-6">
              <Label className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">How did you hear about us?</Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {referralOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectChange("referralSource", option)}
                    className={cn(
                      "p-4 md:p-5 rounded-2xl border transition-all text-sm md:text-base font-bold text-center flex items-center justify-center gap-2 shadow-sm",
                      formData.referralSource === option
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                        : "border-white/40 bg-white/30 hover:bg-white/50 text-[#5A5A7A] dark:text-muted-foreground"
                    )}
                  >
                    {option}
                    {formData.referralSource === option && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label htmlFor="jobTitle" className="text-sm md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Recent Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g., Senior Designer"
                className="h-12 md:h-14 text-sm md:text-lg rounded-2xl bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Experience Level</Label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(val) => handleSelectChange("experienceLevel", val)}
              >
                <SelectTrigger className="h-12 md:h-14 text-sm md:text-lg rounded-2xl bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/20 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium shadow-sm">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl">
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value} className="focus:bg-indigo-50 text-base font-medium">
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Topics for Recommendations (Multiple)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[180px] md:max-h-[250px] p-1 scrollbar-thin scrollbar-thumb-indigo-200">
                {topicOptions.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={cn(
                      "px-3 md:px-4 py-2.5 md:py-3 rounded-xl border text-xs md:text-sm font-bold transition-all text-left flex items-center justify-between gap-2 shadow-sm",
                      formData.selectedTopics.includes(topic)
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                        : "border-white/40 bg-white/30 hover:border-indigo-500/50 text-[#5A5A7A] dark:text-muted-foreground"
                    )}
                  >
                    <span className="truncate">{topic}</span>
                    {formData.selectedTopics.includes(topic) && (
                      <Check className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs md:text-sm text-[#5A5A7A] dark:text-muted-foreground font-medium bg-white/30 p-3 rounded-xl border border-white/20 italic">
                We'll suggest relevant jobs and interview questions based on these choice.
              </p>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-3">
                <Label className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Job Type Preference</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {jobTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectChange("jobType", type)}
                      className={cn(
                        "p-3 md:p-4 rounded-2xl border transition-all text-sm font-bold shadow-sm whitespace-nowrap",
                        formData.jobType === type
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                          : "border-white/40 bg-white/30 hover:bg-white/50 text-[#5A5A7A] dark:text-muted-foreground"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Work Setup</Label>
                <div className="grid grid-cols-3 gap-3">
                  {remotePreferences.map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => handleSelectChange("remotePreference", pref)}
                      className={cn(
                        "p-3 md:p-4 rounded-2xl border transition-all text-sm font-bold shadow-sm text-center",
                        formData.remotePreference === pref
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                          : "border-white/40 bg-white/30 hover:bg-white/50 text-[#5A5A7A] dark:text-muted-foreground"
                      )}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="location" className="text-base md:text-lg font-bold text-[#2A2A4A] dark:text-white px-1">Preferred Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., London, Remote, New York"
                  className="h-12 md:h-14 text-base md:text-lg rounded-2xl bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm font-medium"
                />
              </div>
            </div>
          </motion.div>
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
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-x-hidden flex items-center justify-center p-4 md:p-6 font-syne">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] md:w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px] md:blur-[150px] animate-blob" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] md:w-[50%] h-[50%] bg-blue-500/15 rounded-full blur-[100px] md:blur-[150px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[10%] w-[40%] md:w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[80px] md:blur-[120px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 jigsaw-background opacity-[0.04]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl mx-auto"
      >
        <div className="bg-white/40 dark:bg-card/30 backdrop-blur-2xl rounded-3xl md:rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-white/40 dark:border-white/10 flex flex-col w-full max-h-[calc(100dvh-2rem)] md:max-h-[calc(100vh-4rem)] lg:max-h-[min(900px,94vh)]">
          <div className="p-6 md:p-10 pb-4">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div className="flex gap-2.5 md:gap-3 overflow-hidden flex-1 mr-6">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "h-2 md:h-2.5 rounded-full transition-all duration-700 ease-in-out",
                      currentStep === step.id
                        ? "bg-gradient-to-r from-indigo-500 to-blue-600 w-12 md:w-24 shadow-md shadow-indigo-500/20"
                        : currentStep > step.id
                          ? "bg-indigo-500/30 w-4 md:w-10"
                          : "bg-white/40 w-4 md:w-10"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] md:text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm">
                Step {currentStep}/{steps.length}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#2A2A4A] dark:text-white flex items-center gap-3 md:gap-4 font-syne">
                <div className="p-2 md:p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/20 shrink-0">
                  <currentStepData.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                {currentStepData.title}
              </h1>
              <p className="text-[#5A5A7A] dark:text-muted-foreground text-lg md:text-xl font-medium line-clamp-2 md:line-clamp-none">
                {currentStepData.description}
              </p>
            </div>
          </div>

          <div className="px-6 md:px-10 flex-1 py-4 md:py-6 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          <div className="p-6 md:p-10 bg-white/20 dark:bg-white/5 border-t border-white/40 dark:border-white/10 flex items-center justify-between mt-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="h-12 md:h-14 px-6 md:px-8 rounded-2xl hover:bg-white/50 dark:hover:bg-card/50 text-[#5A5A7A] dark:text-white font-bold transition-all"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className="h-12 md:h-14 px-8 md:px-12 rounded-2xl bg-gradient-to-r from-[#6e56cf] to-[#2ab0ff] text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.03] active:scale-[0.98] text-base md:text-lg font-black tracking-wide border-none group"
            >
              {isSubmitting ? (
                "Setting up..."
              ) : currentStep === steps.length ? (
                <>
                  Complete <Rocket className="w-5 h-5 md:w-6 md:h-6 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
