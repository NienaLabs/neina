'use client';

import React, { useState } from 'react';
import { CheckIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence, useInView, Variants } from 'framer-motion';

interface Plan {
  name: string;
  price: number;
  description: string;
  features: string[];
  buttonText: string;
  featured: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfect for individuals getting started',
    features: [
      '5 job applications',
      'Basic resume builder',
      'Email support',
      'Job matching',
    ],
    buttonText: 'Get Started',
    featured: false,
  },
  {
    name: 'Professional',
    price: 29,
    description: 'For professionals looking to accelerate their job search',
    features: [
      'Unlimited job applications',
      'Advanced resume builder',
      'Priority email support',
      'AI-powered job matching',
      'Interview preparation',
      'Cover letter generator',
    ],
    buttonText: 'Get Professional',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For career changers and executives',
    features: [
      'Everything in Professional',
      'Dedicated career coach',
      '24/7 priority support',
      'LinkedIn optimization',
      'Negotiation assistance',
      'Resume review by HR experts',
    ],
    buttonText: 'Contact Sales',
    featured: false,
  },
];

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and PayPal.',
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes, you can try our Professional plan free for 14 days.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel anytime from your account settings.',
  },
  {
    question: 'Do you offer discounts for students?',
    answer: 'Yes, we offer a 50% discount for students with a valid .edu email.',
  },
  {
    question: 'Is my data secure?',
    answer: 'We take security seriously and use industry-standard encryption.',
  },
];

const PricingCard: React.FC<{ plan: Plan; index: number }> = ({ plan, index }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.1,
  });

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
    hover: {
      y: -10,
      transition: { duration: 0.3 },
    },
  };

  const featureVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.3 + i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      whileHover={plan.featured ? 'hover' : undefined}
      variants={cardVariants}
      className={`relative ${plan.featured ? 'z-10' : 'z-0'}`}
    >
      <div
        className={`relative rounded-2xl shadow-lg overflow-hidden ${
          plan.featured ? 'ring-2 ring-indigo-500' : 'border border-gray-200 dark:border-gray-700'
        }`}
      >
        {plan.featured && (
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
            POPULAR
          </div>
        )}
        <div className="px-6 py-8 bg-white dark:bg-gray-800 sm:p-10 sm:pb-6">
          <div>
            <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600">
              {plan.name}
            </h3>
          </div>
          <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900 dark:text-white">
            ${plan.price}
            <span className="ml-1 text-2xl font-medium text-gray-500 dark:text-gray-300">/mo</span>
          </div>
          <p className="mt-5 text-lg text-gray-500 dark:text-gray-300">{plan.description}</p>
        </div>
        <div className="px-6 pt-6 pb-8 bg-gray-50 dark:bg-gray-700 sm:p-10 sm:pt-6">
          <ul className="space-y-4">
            {plan.features.map((feature, i) => (
              <motion.li
                key={i}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={featureVariants}
                className="flex items-start"
              >
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                </div>
                <p className="ml-3 text-base text-gray-700 dark:text-gray-200">{feature}</p>
              </motion.li>
            ))}
          </ul>
          <div className="mt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                plan.featured ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              {plan.buttonText}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FAQItem: React.FC<{ item: { question: string; answer: string }; index: number }> = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div 
      className="border-b border-gray-200 dark:border-gray-700 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{item.question}</h4>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-base text-gray-500 dark:text-gray-300">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.1,
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Pricing plans for teams of all sizes
          </h2>
          <motion.p
            className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Choose an affordable plan that&apos;s packed with the best features for engaging your audience, creating customer loyalty, and driving success.
          </motion.p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly billing
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`ml-1 px-4 py-2 text-sm font-medium rounded-md ${
                billingCycle === 'annually'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={() => setBillingCycle('annually')}
            >
              Annual billing
            </motion.button>
            {billingCycle === 'annually' && (
              <motion.span
                className="ml-3 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Save 20%
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          ref={ref}
          className="mt-16 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8"
          variants={container}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
        >
          {plans.map((plan, index) => (
            <motion.div key={plan.name} variants={item}>
              <PricingCard plan={plan} index={index} />
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">
            Frequently asked questions
          </h2>
          <div className="mt-12 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <FAQItem key={index} item={faq} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
