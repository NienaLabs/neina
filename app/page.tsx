'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from '../components/landing/Hero';
import  Features  from '../components/landing/Features';
import Testimonials from '../components/landing/Testimonials';
import  HowItWorks  from '../components/landing/HowItWorks';
import  FAQ  from '../components/landing/FAQ';
import  Footer  from '../components/landing/Footer';

export default function LandingPage() {
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
