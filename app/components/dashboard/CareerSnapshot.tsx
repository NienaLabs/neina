import React from "react";
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

interface StatItem {
  id: 'resume' | 'match' | 'roadmap';
  name: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: string;
}

interface UserData {
  resumeStrength: number;
  jobMatchRate: number;
  roadmapProgress: number;
}

interface CareerSnapshotProps {
  userData: UserData;
}

const CareerSnapshot: React.FC<CareerSnapshotProps> = ({ userData }) => {
  const stats: StatItem[] = [
    {
      id: "resume",
      name: "Resume Strength",
      value: `${userData.resumeStrength}%`,
      icon: DocumentTextIcon,
      color: "from-blue-600 to-blue-400",
      action: "View current resume",
    },
    {
      id: "match",
      name: "Job Match Rate",
      value: `${userData.jobMatchRate}%`,
      icon: ChartBarIcon,
      color: "from-purple-600 to-indigo-400",
      action: "See matches",
    },
    {
      id: "roadmap",
      name: "Roadmap Progress",
      value: `${userData.roadmapProgress}%`,
      icon: MapIcon,
      color: "from-green-600 to-emerald-400",
      action: "View roadmap",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Career Snapshot
        </h2>
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 transition-all"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-gray-50 dark:bg-gray-700/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white shadow`}
              >
                <stat.icon className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-700`}
                  style={{
                    width: `${
                      stat.id === "resume"
                        ? userData.resumeStrength
                        : stat.id === "match"
                        ? userData.jobMatchRate
                        : userData.roadmapProgress
                    }%`,
                  }}
                />
              </div>

              <div className="mt-2 text-right">
                <a
                  href="#"
                  className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {stat.action} →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerSnapshot;
