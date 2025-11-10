'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from './components/landing/Hero';
import  Features  from './components/landing/Features';
import Testimonials from './components/landing/Testimonials';
import  HowItWorks  from './components/landing/HowItWorks';
import  FAQ  from './components/landing/FAQ';
import  Footer  from './components/landing/Footer';



type Feature = {
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  benefits: string[];
};

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("authToken", "dummy-token");
    }
    router.push('/Onboarding');
  };

  const features = [
    {
      name: "AI Resume Builder",
      description: "Create professional, ATS-optimized resumes in minutes with our AI-powered builder.",
      icon: "📝",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      benefits: ["ATS Optimization", "Custom Templates", "One-Click Formatting"],
    },
    {
      name: "Interview Coach",
      description: "Practice with our AI interviewer and receive detailed feedback on your responses.",
      icon: "💬",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      benefits: ["Real-time Feedback", "Common Questions", "Performance Analytics"],
    },
    {
      name: "Smart Job Matcher",
      description: "Discover opportunities that align with your skills and career goals.",
      icon: "🎯",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      benefits: ["Personalized Matches", "Salary Insights", "Company Culture Fit"],
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <Hero/>
      <Features />
      <Testimonials />
      <HowItWorks />
      <FAQ />
      <Footer />
    </div>
  );
}
