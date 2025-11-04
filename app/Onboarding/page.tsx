"use client";

import { useState, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  BriefcaseIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface FormData {
  fullName: string;
  email: string;
  jobTitle: string;
  experienceLevel: string;
  skills: string[];
  location: string;
  jobType: string;
  remotePreference: string;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  fields: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const containerClasses =
    "fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4";
  const cardClasses =
    "bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden";
  const contentClasses = "p-6 overflow-y-auto flex-1";

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    jobTitle: "",
    experienceLevel: "",
    skills: [],
    location: "",
    jobType: "Full-time",
    remotePreference: "Hybrid",
  });
  const [skillInput, setSkillInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome to JobAI",
      description: "Let's get to know you better to personalize your experience.",
      icon: UserCircleIcon,
      color: "text-blue-500",
      fields: ["fullName", "email"],
    },
    {
      id: 2,
      title: "Your Professional Background",
      description: "Tell us about your work experience and skills.",
      icon: BriefcaseIcon,
      color: "text-purple-500",
      fields: ["jobTitle", "experienceLevel", "skills"],
    },
    {
      id: 3,
      title: "Job Preferences",
      description: "Help us find the perfect job matches for you.",
      icon: MapPinIcon,
      color: "text-green-500",
      fields: ["jobType", "remotePreference", "location"],
    },
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (2-5 years)" },
    { value: "senior", label: "Senior Level (5+ years)" },
    { value: "executive", label: "Executive" },
  ];

  const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
  const remotePreferences = ["Remote", "Hybrid", "On-site"];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        skills: [...new Set([...prev.skills, skillInput.trim()])],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleNext = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      // Handle form submission here
      // For now, just redirect to the dashboard
      setTimeout(() => {
        router.push('/Dashboard');
        setIsSubmitting(false);
      }, 1500);
    }
  }, [currentStep, steps.length, router]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentStepData = steps.find((step) => step.id === currentStep)!;
  const progress = (currentStep / steps.length) * 100;

  // 🧩 Renders dynamic content based on step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current/Most Recent Job Title
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                placeholder="e.g., Software Engineer"
                required
              />
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                required
              >
                <option value="">Select your experience level</option>
                {experienceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillAdd}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                placeholder="Type a skill and press Enter"
              />
              <p className="text-xs text-gray-500 mt-1">Press Enter to add a skill</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Job Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred Job Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {jobTypes.map((type) => (
                  <label
                    key={type}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.jobType === type
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jobType"
                      value={type}
                      checked={formData.jobType === type}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {type}
                      </span>
                      {formData.jobType === type && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Remote Preference */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Remote Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                {remotePreferences.map((pref) => (
                  <label
                    key={pref}
                    className={`relative p-3 border rounded-lg cursor-pointer text-center transition-all ${
                      formData.remotePreference === pref
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="remotePreference"
                      value={pref}
                      checked={formData.remotePreference === pref}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {pref}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                placeholder="e.g., New York, Remote, etc."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Progress bar */}
        <div className="px-6 pt-6 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                    {step.title.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={contentClasses}>
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
              {currentStepData.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>
          </div>

          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium ${
                currentStep === 1
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              <ArrowLeftIcon className="-ml-1 mr-1 h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Loading..." : currentStep === steps.length ? "Get Started" : "Continue"}
              {!isSubmitting && <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

