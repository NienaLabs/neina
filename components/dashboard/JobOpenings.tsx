"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView, Variants } from 'framer-motion';
import {  ExternalLink as ArrowTopRightOnSquareIcon } from 'lucide-react';
import { 
  Briefcase as BriefcaseIcon, 
  MapPin as MapPinIcon, 
  Clock as ClockIcon, 
  ArrowRight as ArrowRightIcon, 
  DollarSign as CurrencyDollarIcon,
  Bookmark as BookmarkIcon,
  Loader2 as LoaderIcon
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
  match: number;
  logo?: string;
  location: string;
  type: string;
  postedDate?: string;
  salaryRange?: string;
  isNew?: boolean;
  isApplied?: boolean;
  // For backward compatibility
  salary?: string;
  posted?: string;
  applicants?: number;
}

interface JobOpeningsProps {
  jobs?: Job[];
}

// Animation variants with reduced sensitivity
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }
};

const JobOpenings: React.FC<JobOpeningsProps> = ({ jobs = [] }) => {
  const router = useRouter();
  const [visibleJobs, setVisibleJobs] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const controlsRef = useRef(null);
  const isInView = useInView(controlsRef, { once: true });

  const getMatchBadge = (match: number) => {
    if (match >= 85) {
      return {
        text: 'Excellent match',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      };
    } else if (match >= 70) {
      return {
        text: 'Good match',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      };
    } else {
      return {
        text: 'Fair match',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      };
    }
  };

  const handleLoadMore = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleJobs(prev => Math.min(prev + 3, jobs.length));
      setIsLoading(false);
    }, 300);
  };

  // Add more job listings if the list is empty
  if (!jobs.length) {
    jobs = [
      {
        id: 1,
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        match: 95,
        location: 'San Francisco, CA',
        salary: '$120,000 - $150,000',
        type: 'Full-time',
        posted: '2d ago',
        applicants: 12
      },
      {
        id: 2,
        title: 'UI/UX Designer',
        company: 'DesignHub',
        match: 92,
        location: 'Remote',
        type: 'Contract',
        posted: '2d ago',
        applicants: 5
      },
      {
        id: 3,
        title: 'Full Stack Developer',
        company: 'WebSolutions',
        match: 78,
        location: 'New York, NY',
        type: 'Full-time',
        posted: '1d ago',
        applicants: 10
      }
    ];
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Jobs Tailored to You</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Based on your profile and preferences</p>
          </div>
          <button 
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            View all jobs
            <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />
          </button>
        </div>
      </div>

      <motion.div 
        className="divide-y divide-gray-100 dark:divide-gray-700"
        variants={container}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        ref={controlsRef}
      >
        {jobs.slice(0, visibleJobs).map((job, index) => {
          const matchBadge = job?.match !== undefined ? getMatchBadge(job.match) : { text: 'N/A', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
          const isNew = Math.random() > 0.5; // Randomly mark some jobs as new
          
          return (
            <motion.div 
              key={job.id}
              variants={item}
              className="relative group bg-white dark:bg-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-700/70 transition-colors duration-150 ease-in-out border-b border-gray-100 dark:border-gray-700 last:border-0"
              whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {job?.company?.charAt(0) || '?'}
                        </div>
                        {isNew && (
                          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {job?.title || 'Job Title'}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {job.match}% match
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{job?.company || 'Company'}</p>
                        <div className="flex items-center mt-1 space-x-4">
                          <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="h-3.5 w-3.5 mr-1" />
                            Remote
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-3.5 w-3.5 mr-1" />
                            Full-time
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <CurrencyDollarIcon className="h-3.5 w-3.5 mr-1" />
                            $90K – $120K
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-3">
                    <button
                      type="button"
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-600/50 dark:hover:text-gray-300 transition-colors"
                      title="Save job"
                    >
                      <BookmarkIcon className="h-5 w-5" />
                      <span className="sr-only">Save job</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {matchBadge.text}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Posted 2d ago • 12 applicants
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <span>View Details</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <span>Quick Apply</span>
                      <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
})}
      </motion.div>

      <AnimatePresence>
        {visibleJobs < jobs.length && (
          <motion.div 
            className="px-6 pb-6 pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'Load more jobs'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobOpenings;
