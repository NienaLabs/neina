"use client";

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  FileText as DocumentTextIcon, 
  Briefcase as BriefcaseIcon, 
  MessageSquare as ChatBubbleLeftRightIcon, 
  Map as MapIcon, 
  GraduationCap as AcademicCapIcon,
  ArrowRight as ArrowRightIcon
} from 'lucide-react';
import { useState } from 'react';

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
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
  },
  {
    id: 'jobs',
    name: 'Find Jobs',
    description: 'Discover jobs matching your profile',
    icon: BriefcaseIcon,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30'
  },
  {
    id: 'interview',
    name: 'Practice Interview',
    description: 'Prepare with AI-powered mock interviews',
    icon: ChatBubbleLeftRightIcon,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
  },
  {
    id: 'roadmap',
    name: 'Career Roadmap',
    description: 'Plan your career growth path',
    icon: MapIcon,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
  },
  {
    id: 'skills',
    name: 'Skill Assessment',
    description: 'Evaluate and improve your skills',
    icon: AcademicCapIcon,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    hoverColor: 'hover:bg-rose-100 dark:hover:bg-rose-900/30'
  }
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

const hoverEffect = {
  scale: 1.02,
  transition: {
    type: "spring" as const,
    stiffness: 500,
    damping: 15
  }
};

const ActionCard = ({ action, hoveredId, onHover }: { action: ActionItem, hoveredId: ActionId | null, onHover: (id: ActionId | null) => void }) => (
  <motion.div
    className={`relative h-36 flex flex-col p-5 rounded-xl cursor-pointer transition-all duration-200 ${action.bgColor} ${action.hoverColor} border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md`}
    variants={item}
    whileHover={hoverEffect}
    onHoverStart={() => onHover(action.id)}
    onHoverEnd={() => onHover(null)}
  >
    <div className="flex items-start justify-between h-full">
      <div className="flex flex-col h-full justify-between w-full pr-2">
        <div className="flex items-start justify-between w-full mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bgColor}`}>
            <action.icon className={`w-5 h-5 ${action.iconColor}`} />
          </div>
        </div>
        <div className="w-full">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5 leading-tight">
            {action.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
            {action.description}
          </p>
        </div>
        <motion.div
          className="self-end mt-2"
          animate={{
            x: hoveredId === action.id ? 4 : 0,
            opacity: hoveredId === action.id ? 1 : 0.7
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400" />
        </motion.div>
      </div>
    </div>
    
    {hoveredId === action.id && (
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-blue-400 pointer-events-none"
        layoutId="hoverBorder"
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </motion.div>
);

export default function QuickActions() {
  const [hoveredId, setHoveredId] = useState<ActionId | null>(null);
  const topRow = actions.slice(0, 2);
  const bottomRow = actions.slice(2, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
      </div>
      
      <div className="space-y-5">
        {/* Top Row */}
        <motion.div 
          className="grid gap-5 grid-cols-1 sm:grid-cols-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {topRow.map((action) => (
              <ActionCard 
                key={action.id} 
                action={action} 
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Row */}
        {bottomRow.length > 0 && (
          <motion.div 
            className="grid gap-5 grid-cols-1 sm:grid-cols-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {bottomRow.map((action) => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
