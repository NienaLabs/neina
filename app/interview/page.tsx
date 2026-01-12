'use client';

import { InterviewCard } from "@/components/interview/InterviewCard";
import { 
  ClipboardCheck, 
  Brain, 
  Code, 
  LayoutGrid, 
  Award, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureGuide } from "@/components/FeatureGuide";

export default function InterviewLandingPage() {
  const interviewTypes = [
    {
      title: "Screening Interview",
      description: "Short interviews to align expectations and qualifications. Perfect for initial rounds.",
      icon: ClipboardCheck,
      href: "/interview/screening",
      color: "text-emerald-500",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2000&auto=format&fit=crop"
    },
    {
      title: "Behavioral Interview",
      description: "Scenario-based questions to measure past experiences as a predictor for future success.",
      icon: Brain,
      href: "/interview/behavioral",
      color: "text-violet-500",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2000&auto=format&fit=crop"
    },
    {
      title: "Technical Interview",
      description: "Assess technical skills and knowledge with coding challenges and deeper technical questions.",
      icon: Code,
      href: "/interview/technical",
      color: "text-blue-500",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000&auto=format&fit=crop"
    },
    {
      title: "General Interview",
      description: "A comprehensive mix of screening, behavioral, and technical questions.",
      icon: LayoutGrid,
      href: "/interview/general",
      color: "text-amber-500",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2000&auto=format&fit=crop"
    },
    {
      title: "Promotion / Scholarship",
      description: "Tailored for internal promotions or scholarship applications based on specific roles.",
      icon: Award,
      href: "/interview/promotion",
      color: "text-rose-500",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-[-10%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto py-12 px-4 max-w-7xl relative z-10">
          <div className="flex flex-col gap-2 mb-12">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors w-fit flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                 <ArrowLeft className="w-4 h-4" />
              </div>
              Back to Dashboard
            </Link>
            
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white inline-flex items-center gap-3">
                  AI Interview Coach
                  <FeatureGuide
                    description="Practice realistic interviews with AI. Choose from screening, behavioral, technical, general, or promotion/scholarship interview types. Get instant feedback to improve your performance."
                    side="right"
                  />
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
                  Master your interview skills with our <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 font-semibold">AI-powered coach</span>. 
                  Choose a category below to start your personalized session.
                </p>
            </div>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviewTypes.map((type) => (
              <InterviewCard key={type.title} {...type} />
            ))}
          </div>
        </div>
    </div>
  );
}
