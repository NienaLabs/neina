"use client";

import { motion, Variants } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Insight {
  readiness: number;
  nextStep: string;
  summary: string;
}

interface AIInsightsProps {
  insight: Insight;
}

const container:Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item:Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

export default function AIInsights({ insight }: AIInsightsProps) {
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div 
        className="flex items-center gap-3 mb-6"
        variants={item}
      >
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
          <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Career Insights
        </h3>
      </motion.div>

      <motion.div 
        className="space-y-6"
        variants={item}
      >
        <motion.div variants={item}>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Career Readiness
            </span>
            <motion.span 
              className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {insight.readiness}%
            </motion.span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${insight.readiness}%` }}
              transition={{ duration: 1, delay: 0.2, type: "spring" }}
            />
          </div>
        </motion.div>

        <motion.div 
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
          variants={item}
        >
          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            Next Step
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {insight.nextStep}
          </p>
        </motion.div>

        <motion.div 
          className="pt-4 border-t border-gray-100 dark:border-gray-700"
          variants={item}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {insight.summary}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}