"use client";

import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  BriefcaseIcon, 
  ChatBubbleLeftRightIcon, 
  MapIcon, 
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

type ActionId = 'resume' | 'jobs' | 'interview' | 'roadmap' | 'skills';

interface ActionItem {
  id: ActionId;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  iconColor: string;
  bgColor: string;
  hoverColor: string;
}

const actions: ActionItem[] = [
  {
    id: 'resume',
    name: 'Build Resume',
    description: 'Create or update your resume with AI assistance',
    icon: DocumentTextIcon,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/50',
  },
  {
    id: 'jobs',
    name: 'Find Jobs',
    description: 'Discover jobs that match your profile',
    icon: BriefcaseIcon,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/50',
  },
  {
    id: 'interview',
    name: 'Start Interview',
    description: 'Practice with AI-powered mock interviews',
    icon: ChatBubbleLeftRightIcon,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/50',
  },
  {
    id: 'roadmap',
    name: 'View Roadmap',
    description: 'Track your learning and career path',
    icon: MapIcon,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
    hoverColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/50',
  },
  {
    id: 'skills',
    name: 'Improve Skills',
    description: 'Access learning resources and courses',
    icon: AcademicCapIcon,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/50',
  },
];

const QuickActions: React.FC = () => {
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);

  const handleAction = (id: ActionId): void => {
    setActiveAction(id);
    switch (id) {
      case 'resume':
        console.log('Navigate to Resume Builder');
        // navigate('/resume-builder');
        break;
      case 'jobs':
        console.log('Navigate to Job Finder');
        // navigate('/jobs');
        break;
      case 'interview':
        console.log('Navigate to Interview Practice');
        // navigate('/interview');
        break;
      case 'roadmap':
        console.log('Navigate to Roadmap');
        // navigate('/roadmap');
        break;
      case 'skills':
        console.log('Navigate to Learning Resources');
        // navigate('/skills');
        break;
      default:
        console.log(`Action ${id} clicked`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 pb-4 h-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-2.5">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            className={`group relative flex items-center space-x-3 rounded-xl border border-gray-200 dark:border-gray-700 ${action.bgColor} ${action.hoverColor} p-4 focus:outline-none transition-all duration-200 ${
              activeAction === action.id ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
            }`}
          >
            <div className={`flex-shrink-0 h-12 w-12 rounded-lg ${action.bgColor} flex items-center justify-center`}>
              <action.icon 
                className={`h-6 w-6 ${action.iconColor} transition-transform duration-200 group-hover:scale-110`} 
                aria-hidden="true" 
              />
            </div>
            <div className="min-w-0 flex-1 text-left space-y-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{action.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{action.description}</p>
            </div>
            <div className="flex-shrink-0 self-stretch flex items-center">
              <ArrowRightIcon 
                className="h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-all duration-200 group-hover:translate-x-0.5" 
                aria-hidden="true" 
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
