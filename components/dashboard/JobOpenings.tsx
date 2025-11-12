"use client";

import React, { useState } from 'react';
import { 
  Briefcase as BriefcaseIcon, 
  MapPin as MapPinIcon, 
  Clock as ClockIcon, 
  ArrowRight as ArrowRightIcon, 
  DollarSign as CurrencyDollarIcon,
  Bookmark as BookmarkIcon,
  ExternalLink as ArrowTopRightOnSquareIcon
} from 'lucide-react';

interface Job {
  id: string | number;
  title: string;
  company: string;
  match: number;
  // Add other job properties as needed
}

interface JobOpeningsProps {
  jobs?: Job[];
}

const JobOpenings: React.FC<JobOpeningsProps> = ({ jobs = [] }) => {
  const [visibleJobs, setVisibleJobs] = useState(3);

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

  const handleLoadMore = () => {
    setVisibleJobs((prev) => prev + 3);
  };

  if (!jobs.length) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Jobs Tailored to You</h2>
        <p className="text-gray-500 dark:text-gray-400">No job matches found yet. Try updating your skills or resume!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Jobs Tailored to You</h2>
        <button 
          type="button"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all jobs →
        </button>
      </div>

      <div className="space-y-4">
        {jobs.slice(0, visibleJobs).map((job) => {
          const matchBadge = job?.match !== undefined ? getMatchBadge(job.match) : { text: 'N/A', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };

          return (
            <div 
              key={job.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {job?.company?.charAt(0) || '?'}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{job?.title || 'Job Title'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{job?.company || 'Company'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${matchBadge.color}`}>
                    {matchBadge.text} • {job.match}%
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <BookmarkIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Save job</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Posted 2 days ago</span>
                  <span className="mx-2">•</span>
                  <span>Full-time</span>
                  <span className="mx-2">•</span>
                  <span>Remote</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all"
                  >
                    Quick apply
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-all"
                >
                  View similar jobs
                  <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {visibleJobs < jobs.length && (
        <div className="mt-6">
          <button
            onClick={handleLoadMore}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Load more jobs
          </button>
        </div>
      )}
    </div>
  );
};

export default JobOpenings;
