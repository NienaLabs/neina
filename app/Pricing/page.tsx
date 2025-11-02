import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

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

const Pricing: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Pricing plans for teams of all sizes
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300">
            Choose an affordable plan that's packed with the best features for engaging your audience, creating customer loyalty, and driving success.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center items-center">
          <span className="font-medium text-gray-700 dark:text-gray-300">Monthly</span>
          <button
            type="button"
            className="mx-4 flex h-6 w-11 items-center rounded-full bg-blue-600 p-0.5 cursor-pointer"
            aria-pressed="false"
          >
            <span className="sr-only">Toggle billing</span>
            <span
              aria-hidden="true"
              className="h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Yearly <span className="text-blue-600 dark:text-blue-400">(Save 20%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition ${
                plan.featured
                  ? 'border-blue-500 border-2 shadow-md'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    Most popular
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                {plan.price > 0 ? (
                  <p className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                    <span className="text-5xl font-extrabold">${plan.price}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-gray-400">
                      /month
                    </span>
                  </p>
                ) : (
                  <p className="mt-4 text-5xl font-extrabold text-gray-900 dark:text-white">Free</p>
                )}
                <p className="mt-4 text-gray-500 dark:text-gray-400">{plan.description}</p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className="h-6 w-6 text-green-500" />
                      <span className="ml-3 text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#"
                className={`mt-8 block w-full rounded-md px-6 py-3 text-center text-base font-medium text-white transition ${
                  plan.featured
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-800 hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {plan.buttonText}
              </a>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">
            Frequently asked questions
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {faqs.map((faq, index) => (
              <div key={index} className="pt-6">
                <dt className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</dt>
                <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">{faq.answer}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
