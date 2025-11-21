"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  FileText as DocumentTextIcon,
  Briefcase as BriefcaseIcon,
  MessageSquare as ChatBubbleLeftRightIcon,
  GraduationCap as AcademicCapIcon,
} from "lucide-react";

type ActionId = "resume" | "jobs" | "interview" | "skills";

interface ActionItem {
  id: ActionId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  hoverColor: string;
}

const actions: ActionItem[] = [
  {
    id: "resume",
    name: "Build Resume",
    icon: DocumentTextIcon,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
  },
  {
    id: "jobs",
    name: "Find Jobs",
    icon: BriefcaseIcon,
    iconColor: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
  },
  {
    id: "interview",
    name: "Practice Interview",
    icon: ChatBubbleLeftRightIcon,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
  },
  {
    id: "skills",
    name: "Skill Assessment",
    icon: AcademicCapIcon,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    hoverColor: "hover:bg-rose-100 dark:hover:bg-rose-900/30",
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 15 },
  },
};

const hoverEffect = {
  scale: 1.05,
  transition: { type: "spring" as const, stiffness: 400, damping: 20 },
};

const ActionCard = ({
  action,
  hoveredId,
  onHover,
}: {
  action: ActionItem;
  hoveredId: ActionId | null;
  onHover: (id: ActionId | null) => void;
}) => (
  <motion.div
    className={`relative flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all duration-200 ${action.bgColor} ${action.hoverColor} border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md h-[140px]`}
    variants={item}
    whileHover={hoverEffect}
    onHoverStart={() => onHover(action.id)}
    onHoverEnd={() => onHover(null)}
  >
    <div
      className={`w-14 h-14 rounded-lg flex items-center justify-center ${action.bgColor} mb-3 shadow-sm`}
    >
      <action.icon className={`w-7 h-7 ${action.iconColor}`} />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
      {action.name}
    </h3>

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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        ))}
      </motion.div>
    </div>
  );
}
