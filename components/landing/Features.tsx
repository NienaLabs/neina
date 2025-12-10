"use client"
import {Button} from '@/components/ui/button'
import Cube from './Cube'
import { Star,Briefcase,FileText,MessageSquare } from 'lucide-react'

const Features = () => {
  return (
    <section id="features" className="py-20 md:py-32 px-4 md:px-6 relative overflow-hidden bg-white">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-indigo-100/30 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
        Join The Few People Job Hunting With Ease
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three powerful tools designed to accelerate your career journey
          </p>
        </div>

        {/* Main Content: Cube + Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Video Demo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-2xl p-2 border border-indigo-100 shadow-xl">
               {/* Creative CTA */}
               <div className="absolute -top-12 -right-8 md:-right-12 z-20 hidden md:block animate-bounce duration-[2000ms]">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 blur-sm rounded-full opacity-50"></div>
                  <div className="relative bg-white border-2 border-yellow-400 px-4 py-2 rounded-full shadow-lg transform rotate-6">
                    <p className="font-bold text-sm text-indigo-900 whitespace-nowrap flex items-center gap-1">
                      ✨ See it in action!
                    </p>
                  </div>
                  {/* Arrow pointing down-left */}
                  <svg className="absolute top-full left-0 w-8 h-8 text-yellow-500 transform -scale-x-100 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Video Container */}
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 relative">
                <iframe 
                  className="w-full h-full absolute inset-0"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=ad5Xz8e_lC7sZ9l_" 
                  title="JobAI Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="mt-4 flex items-center justify-between px-2">
                 <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    <p className="text-sm font-medium text-gray-600">Live Preview</p>
                 </div>
                 <p className="text-xs text-indigo-500 font-semibold cursor-pointer hover:underline">
                    Watch full walkthrough →
                 </p>
              </div>
            </div>
          </div>

          {/* Right: Features Grid */}
          <div className="space-y-8">
            {/* Star Rating */}
            <div className="bg-linear-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < 4 ? "fill-amber-400 text-amber-400" : "fill-amber-200 text-amber-200"}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900">4.5/5</span>
              </div>
              <p className="text-sm text-gray-600">Trusted by thousands of job seekers</p>
            </div>

            {/* What We Do - Product Description */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">How We Help Your Career</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Resume AI</p>
                    <p className="text-sm text-gray-600">Optimize and tailor your resume for each job application with AI-powered suggestions that boost your ATS score</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                    <Briefcase size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Job Search</p>
                    <p className="text-sm text-gray-600">Discover perfectly matched job opportunities based on your skills and preferences with intelligent AI matching</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                    <MessageSquare size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Interview AI</p>
                    <p className="text-sm text-gray-600">Prepare for an interview by having one with a humanoid AI avatar just like it will happen in a real world scenario with audio and video feedbacks</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Ready to revolutionize your career?
          </p>
          <Button  
            className="inline-block px-8 py-3 rounded-full  font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Features