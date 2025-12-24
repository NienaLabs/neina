"use client"

import React from 'react'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { motion } from 'framer-motion'
import { FileText, Calendar, ShieldCheck, Mail } from 'lucide-react'

const TermsPage = () => {
    return (
        <div className="flex  flex-col min-h-screen bg-white dark:bg-gray-900 font-syne">
            <Header />
            
            <main className="flex-grow pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    {/* Header Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
                            <FileText className="w-4 h-4" />
                            Legal Documentation
                        </div>
                        <h1 className="text-4xl md:text-5xl  text-gray-900 dark:text-white mb-6">
                            Terms of Service Agreement
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Last Revision: 18th December, 2025</span>
                        </div>
                    </motion.div>

                    {/* Content Section */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="prose prose-indigo prose-lg dark:prose-invert max-w-none"
                    >
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 mb-10 rounded-r-xl">
                            <p className="text-amber-800 dark:text-amber-200 font-medium mb-0 leading-relaxed">
                                PLEASE READ THIS TERMS OF SERVICE AGREEMENT CAREFULLY. BY USING THIS WEBSITE OR PRODUCTS FROM THIS WEBSITE YOU AGREE TO BE BOUND BY ALL OF THE TERMS AND CONDITIONS OF THIS AGREEMENT.
                            </p>
                        </div>

                        <p className="leading-relaxed">
                            This Terms of Service Agreement (the "Agreement") governs your use of this website, 
                            <a href="https://app.nienalabs.com" className="text-indigo-600 dark:text-indigo-400 no-underline hover:underline"> https://app.nienalabs.com</a> 
                            (the "Website"), Niena Labs ("Business Name") offer of AI-powered products for use on this Website. 
                            This Agreement includes, and incorporates by this reference, the policies and guidelines referenced below. 
                            Niena Labs reserves the right to change or revise the terms and conditions of this Agreement at any time 
                            by posting any changes or a revised Agreement on this Website.
                        </p>

                        <p className="leading-relaxed">
                            Niena Labs will alert you that changes or revisions have been made by indicating on the top of this Agreement 
                            the date it was last revised. The changed or revised Agreement will be effective immediately after it is posted on this Website. 
                            Your use of the Website following the posting any such changes or of a revised Agreement will constitute your acceptance of any such changes or revisions. 
                            Niena Labs encourages you to review this Agreement whenever you visit the Website to make sure that you understand 
                            the terms and conditions governing use of the Website.
                        </p>

                        <hr className="my-12 border-gray-200 dark:border-gray-800" />

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">I</span>
                                SERVICES PROVIDED
                            </h2>
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Description of Services</h3>
                            <p>Niena is an AI-powered career platform designed to help users:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Craft and optimize job-matching resumes</li>
                                <li>Receive personalized job recommendations based on resume data</li>
                                <li>Practice real-time video interviews with an AI avatar</li>
                                <li>Receive automated analysis of interview performance, including content quality, tone, clarity, and pacing</li>
                            </ul>
                            <p className="mt-4 text-gray-700 dark:text-gray-300">
                                <strong>Job Aggregation:</strong> Niena Labs aggregates job listings from various publicly available sources on the internet ("scraped data") to provide a comprehensive database of opportunities. We do not claim ownership of these listings, and they remain the intellectual property of the original posters.
                            </p>
                            <p className="mt-4 italic text-gray-600 dark:text-gray-400">
                                These services may be offered in free, trial, paid plans, pay as you go or one time payments.
                            </p>
                            
                            <div className="mt-8 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                    No Guarantee of Employment
                                </h3>
                                <p className="mb-0 text-gray-600 dark:text-gray-400">
                                    Niena Labs does not guarantee employment, job offers, interview success, or hiring outcomes. 
                                    All recommendations, feedback, and analyses are provided for informational and educational purposes only.
                                </p>
                            </div>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">II</span>
                                USER ACCOUNTS & COMMUNICATIONS
                            </h2>
                            <h3 className="text-xl font-semibold mb-2">Account Responsibility</h3>
                            <p>
                                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
                            </p>
                            <h3 className="text-xl font-semibold mb-2 mt-6">Communications</h3>
                            <p>
                                By creating an account, you agree that Niena Labs may contact you via email or in-app notifications regarding your account, service updates, or promotional content.
                            </p>
                            <h3 className="text-xl font-semibold mb-2 mt-6">Opt-Out</h3>
                            <p>You may opt out of promotional communications at any time by:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Contacting us at: <a href="mailto:support@nienalabs.com" className="text-indigo-600">support@nienalabs.com</a></li>
                            </ol>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Transactional or service-related communications may still be sent.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">III</span>
                                INTELLECTUAL PROPERTY
                            </h2>
                            <p>
                                All software, AI models, algorithms, designs, text, graphics, logos, videos, and content on Niena are the exclusive property of Niena Labs or its licensors and are protected by applicable intellectual property laws.
                            </p>
                            <p>
                                You may not copy, modify, distribute, reverse-engineer, sell, or exploit any part of the Website or Services without prior written consent from Niena Labs.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">IV</span>
                                USER CONTENT & LICENSE
                            </h2>
                            <p>
                                By uploading resumes, videos, text, or other content (“User Content”), you grant Niena Labs a non-exclusive, worldwide, royalty-free license to use, process, analyze, and display such content solely for the purpose of providing and improving our Services.
                            </p>
                            <p>
                                You represent that you own or have the necessary rights to all User Content you submit.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">V</span>
                                ACCEPTABLE USE
                            </h2>
                            <p>You agree not to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Use the Website for unlawful or fraudulent purposes</li>
                                <li>Upload false, misleading, or harmful information</li>
                                <li>Attempt to bypass security or access restricted systems</li>
                                <li>Interfere with the functionality of the Website</li>
                                <li>Harass, abuse, or impersonate others</li>
                            </ul>
                            <p className="mt-4">
                                Violation of these rules may result in suspension or termination of your account.
                            </p>
                        </section>

                        <section className="mb-12 bg-red-50 dark:bg-red-950/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/50">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-red-900 dark:text-red-400 mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white text-sm">VI</span>
                                DISCLAIMER OF WARRANTIES
                            </h2>
                            <p className="font-bold uppercase text-red-800 dark:text-red-300">
                                THE WEBSITE AND SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.”
                            </p>
                            <p className="text-red-800 dark:text-red-300">
                                NIENA LABS EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-400">
                                <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                                <li>ACCURACY OR RELIABILITY OF AI OUTPUT</li>
                                <li>NON-INFRINGEMENT</li>
                            </ul>
                            <p className="mt-4 text-red-700 dark:text-red-400">We do not warrant that:</p>
                            <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-400">
                                <li>AI feedback or job recommendations are error-free</li>
                                <li>The Website will be uninterrupted or secure</li>
                                <li>Results obtained will meet your expectations</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">VII</span>
                                LIMITATION OF LIABILITY
                            </h2>
                            <p className="font-bold uppercase">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, NIENA LABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR EMPLOYMENT OPPORTUNITIES.
                            </p>
                            <p>
                                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO NIENA LABS FOR SERVICES IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">VIII</span>
                                INDEMNIFICATION
                            </h2>
                            <p>
                                You agree to indemnify and hold harmless Niena Labs, its officers, employees, contractors, and affiliates from any claims, damages, or expenses arising out of:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Your use of the Services</li>
                                <li>Your User Content</li>
                                <li>Your violation of this Agreement or applicable laws</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">IX</span>
                                PRIVACY
                            </h2>
                            <p>
                                Your use of Niena is subject to our Privacy Policy, which explains how we collect, use, and protect your data.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">X</span>
                                TERMINATION
                            </h2>
                            <p>
                                Niena Labs may suspend or terminate your account at any time if we reasonably believe you have violated this Agreement. Upon termination, your access to the Services will cease immediately.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm">XI</span>
                                GENERAL PROVISIONS
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold">Force Majeure</h3>
                                    <p>We are not liable for delays or failures caused by events beyond our reasonable control.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Governing Law</h3>
                                    <p>This Agreement shall be governed by the laws of [Insert Country/State], without regard to conflict of law principles.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Limitation Period</h3>
                                    <p>Any claim must be brought within one (1) year of the event giving rise to the claim.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Waiver of Class Actions</h3>
                                    <p>All claims must be brought individually, not as part of a class or representative action.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Entire Agreement</h3>
                                    <p>This Agreement constitutes the entire agreement between you and Niena Labs regarding the use of the Website and Services.</p>
                                </div>
                            </div>
                        </section>

                        <section className="mb-12 p-8 bg-indigo-600 rounded-3xl text-white">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-indigo-600 text-sm font-bold">XII</span>
                                CONTACT INFORMATION
                            </h2>
                            <div className="space-y-2">
                                <p className="text-xl font-bold">Niena Labs</p>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    <a href="mailto:support@nienalabs.com" className="text-white hover:underline">support@nienalabs.com</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    <a href="https://app.nienalabs.com" className="text-white hover:underline">https://app.nienalabs.com</a>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default TermsPage
