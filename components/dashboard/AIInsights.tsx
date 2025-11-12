import React from 'react';

interface Insight {
  readiness: number;
  nextStep: string;
  summary: string;
}

interface AIInsightsProps {
  insight: Insight;
}

export default function AIInsights({ insight }: AIInsightsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        AI Career Insights
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Career Readiness
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {insight.readiness}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
              style={{ width: `${insight.readiness}%` }}
            />
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Next Step
          </h4>
          <p className="text-blue-700 dark:text-blue-300">{insight.nextStep}</p>
        </div>
        
        <div>
          <p className="text-gray-700 dark:text-gray-300">{insight.summary}</p>
        </div>
      </div>
    </div>
  );
}
