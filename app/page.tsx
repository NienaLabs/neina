'use client';
import { Hero } from '../components/landing/Hero';
import Features from '../components/landing/Features';
import { TestimonialDemo as Testimonials } from '../components/landing/Testimonials';
import HowItWorks from '../components/landing/HowItWorks';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import Header from '../components/landing/Header'
import InterviewAI from '../components/landing/InterviewAI'
import ResumeAI from '../components/landing/ResumeAI'
import JobSearchFeature from '../components/landing/JobSearchFeature'
import { useSession } from '@/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <Header />
      <Hero />
      <Features />
      <ResumeAI />
      <JobSearchFeature />
      <InterviewAI />
      <Testimonials />
      <HowItWorks />
      <FAQ />
      <Footer />
    </div>
  );
}
