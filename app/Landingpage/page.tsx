"use client";

import { useRouter } from 'next/navigation';
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";

type Feature = {
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  benefits: string[];
};

type Stat = {
  label: string;
  value: string;
};

export default function LandingPage() {
  const router = useRouter();
  const features: Feature[] = [
    {
      name: "AI Resume Builder",
      description:
        "Create professional, ATS-optimized resumes in minutes with our AI-powered builder.",
      icon: "📝",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      benefits: ["ATS Optimization", "Custom Templates", "One-Click Formatting"],
    },
    {
      name: "Interview Coach",
      description:
        "Practice with our AI interviewer and receive detailed feedback on your responses.",
      icon: "💬",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      benefits: [
        "Real-time Feedback",
        "Common Questions",
        "Performance Analytics",
      ],
    },
    {
      name: "Smart Job Matcher",
      description:
        "Discover opportunities that align with your skills and career goals.",
      icon: "🎯",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      benefits: [
        "Personalized Matches",
        "Salary Insights",
        "Company Culture Fit",
      ],
    },
  ];

  const stats: Stat[] = [
    { label: "Jobs Found", value: "10K+" },
    { label: "Users Hired", value: "5K+" },
    { label: "Companies", value: "500+" },
    { label: "Success Rate", value: "95%" },
  ];

  const handleGetStarted = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("authToken", "dummy-token");
    }
   
    router.push('/Onboarding');
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 overflow-y-auto">
      {/* Hero Section */}
      <section className="relative w-full py-16 md:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-6">
            🚀 Trusted by thousands of job seekers
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            Land Your Dream Job with{" "}
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Tools
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Streamline your job search with our all-in-one platform. From resume
            building to interview prep, we’ve got you covered.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
            >
              Get Started for Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
            <button className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-800/50 mask-[linear-gradient(180deg,white,transparent)]"></div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-white dark:bg-gray-800">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Our comprehensive tools are designed to give you an edge in
              today's competitive job market.
            </p>
          </div>

          <div className="mt-10 md:mt-12 grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/50 flex flex-col overflow-hidden"
              >
                <div
                  className={`${feature.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}
                >
                  <span className={`text-3xl ${feature.color}`}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {feature.description}
                </p>

                <ul className="space-y-2 mt-4">
                  {feature.benefits.map((benefit, i) => (
                    <li
                      key={i}
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                  >
                    Learn more
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-r from-blue-600 to-purple-600 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to transform your job search?
            </h2>
            <p className="mt-4 text-lg leading-6 text-blue-100">
              Join thousands of professionals who found their dream jobs with
              our platform.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-8 px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
