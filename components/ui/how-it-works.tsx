"use client";

import { cn } from "@/lib/utils";
import { UserPlus, FileText, Mic, Briefcase } from "lucide-react";
import type React from "react";

// The main props for the HowItWorks component
interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

// The props for a single step card
interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

/**
 * A single step card within the "How It Works" section.
 * It displays an icon, title, description, and a list of benefits.
 */
const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
}) => (
  <div
    className={cn(
      "relative rounded-2xl border bg-card p-6 text-card-foreground transition-all duration-300 ease-in-out",
      "hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-muted"
    )}
  >
    {/* Icon */}
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
      {icon}
    </div>
    {/* Title and Description */}
    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
    <p className="mb-6 text-muted-foreground">{description}</p>
    {/* Benefits List */}
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          <span className="text-muted-foreground">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * A responsive "How It Works" section that displays a 4-step process.
 * It is styled with shadcn/ui theme variables to support light and dark modes.
 */
export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const stepsData = [
    {
      icon: <UserPlus className="h-6 w-6" />,
      title: "Create Your Profile",
      description:
        "Sign up and create your professional profile in minutes with our easy-to-use interface.",
      benefits: [
        "Quick setup with LinkedIn import",
        "Profile strength indicator",
        "Privacy controls",
      ],
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Upload & Optimize Resume",
      description:
        "Upload your existing resume or create a new one with our AI-powered builder.",
      benefits: [
        "ATS optimization tips",
        "Skills gap analysis",
        "Customizable templates",
      ],
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "AI-Powered Interview Prep",
      description:
        "Practice with our AI interviewer and get instant feedback on your responses.",
      benefits: [
        "Customized question sets",
        "Real-time feedback",
        "Performance analytics",
      ],
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Get Hired",
      description:
        "Connect with top employers and land your dream job with our support.",
      benefits: [
        "Direct employer connections",
        "Interview scheduling",
        "Offer negotiation tips",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className={cn("w-full bg-background py-16 sm:py-24", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your Path to Career Success
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From creating your profile to landing your dream job, we guide you through every step of the process
          </p>
        </div>

        {/* Step Indicators with Connecting Line */}
        <div className="relative mx-auto mb-8 w-full max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] top-1/2 h-0.5 w-[75%] -translate-y-1/2 bg-border"
          ></div>
          {/* Use grid to align numbers with the card grid below */}
          <div className="relative grid grid-cols-4">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-muted font-semibold text-foreground ring-4 ring-background"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
