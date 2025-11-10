'use client';

import { motion, Variants, Transition } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export default function Features() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
                * { font-family: 'Poppins', sans-serif; }
            `}</style>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-4xl font-bold text-center mx-auto bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Powerful Job Search Tools
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                    Everything you need to find your dream job, prepare for interviews, and track your applications.
                </p>
            </motion.div>
            
            <motion.div 
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
                <motion.div 
                    variants={item}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                    <div className="relative overflow-hidden rounded-xl h-48 mb-6 group">
                        <motion.img 
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" 
                            src="https://helloi.ai/wp-content/uploads/elementor/thumbs/ai-resume-builder-qpa8fir5niayzt9g03ab11oc3hj0t0ooz716qqyfs6.jpeg" 
                            alt="AI Resume Builder"
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Resume Builder</h3>
                    <p className="text-gray-600 dark:text-gray-300">Create ATS-optimized resumes that get you noticed by recruiters and hiring managers.</p>
                </motion.div>
                <motion.div 
                    variants={item}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                    <div className="relative overflow-hidden rounded-xl h-48 mb-6 group">
                        <motion.img 
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" 
                            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1000&q=80" 
                            alt="AI Interview Coach"
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Interview Coach</h3>
                    <p className="text-gray-600 dark:text-gray-300">Practice with realistic interview simulations and get instant feedback on your responses.</p>
                </motion.div>
                <motion.div 
                    variants={item}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                    <div className="relative overflow-hidden rounded-xl h-48 mb-6 group">
                        <motion.img 
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" 
                            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80" 
                            alt="Smart Job Matcher"
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Job Matcher</h3>
                    <p className="text-gray-600 dark:text-gray-300">Discover opportunities that perfectly match your skills and career aspirations.</p>
                </motion.div>
            </motion.div>
        </section>
    );
};