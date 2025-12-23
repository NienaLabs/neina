"use client"

import React from 'react'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Scale, UserCheck, AlertCircle, Info, Mail } from 'lucide-react'

const PrivacyPage = () => {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                            <Shield className="w-4 h-4" />
                            Privacy & Compliance
                        </div>
                        <h1 className="text-4xl md:text-5xl  text-gray-900 dark:text-white mb-6">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Last Updated: 18th December, 2025
                        </p>
                    </motion.div>

                    {/* CONTENT: PRIVACY POLICY */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="prose prose-blue prose-lg dark:prose-invert max-w-none"
                    >
                        <p className="leading-relaxed">
                            Niena Labs ("we", "our", "us") respects your privacy and is committed to protecting personal and business data collected through <span className="font-bold">Niena</span> (<a href="https://app.nienalabs.com" className="text-blue-600 dark:text-blue-400 no-underline hover:underline">https://app.nienalabs.com</a>).
                        </p>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm">1</span>
                                Information We Collect
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                                <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                        <Eye className="w-5 h-5 text-blue-500" />
                                        Job Seeker Data
                                    </h3>
                                    <ul className="text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                                        <li>• Name, email and account credentials</li>
                                        <li>• Resume content and career history</li>
                                        <li>• AI interview video/audio & analytics</li>
                                        <li>• Usage data and interaction logs</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                        <Scale className="w-5 h-5 text-blue-500" />
                                        Recruiter & Business Data
                                    </h3>
                                    <ul className="text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                                        <li>• Company name and rep details</li>
                                        <li>• Job postings and account data</li>
                                        <li>• Business verification docs</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 not-prose">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                    <Lock className="w-5 h-5 text-blue-500" />
                                    Technical Data
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    IP address, device type, browser information, cookies and analytics data.
                                </p>
                            </div>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm">2</span>
                                How We Use Your Information
                            </h2>
                            <p>We use collected data to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provide and improve our services</li>
                                <li>Power AI resume matching and interview analysis</li>
                                <li>Verify recruiter legitimacy and prevent fraud</li>
                                <li>Communicate updates and service notifications</li>
                                <li>Ensure platform security and compliance</li>
                            </ul>
                        </section>

                        <section className="mb-12 bg-blue-50 dark:bg-blue-900/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-blue-900 dark:text-blue-300 mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm">3</span>
                                AI Data Processing
                            </h2>
                            <p className="mb-0">
                                Uploaded resumes, interviews, and job data are processed by automated systems for analysis and recommendations. Human review may occur for quality control, security, or compliance.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm">4</span>
                                Data Sharing
                            </h2>
                            <p>We do <span className="font-bold uppercase text-red-600 dark:text-red-400 italic">not sell</span> your data. Information may be shared only with:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Service providers (hosting, analytics, payments)</li>
                                <li>Legal authorities when required by law</li>
                                <li>Recruiters, when you apply for a job</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm">5</span>
                                Data Retention & Security
                            </h2>
                            <h3 className="text-xl font-bold">Data Retention</h3>
                            <p>
                                We retain data only as long as necessary to provide services or meet legal obligations. You may request deletion of your account and data.
                            </p>
                            <h3 className="text-xl font-bold mt-6">Security</h3>
                            <p>
                                We implement industry-standard safeguards to protect your information. However, no system is 100% secure.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-6">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm">7</span>
                                Your Rights
                            </h2>
                            <p>Depending on your jurisdiction, you may have the right to access, correct, or request deletion of your data, or withdraw consent.</p>
                        </section>

                        <hr className="my-20 border-gray-200 dark:border-gray-800" />

                        {/* SECTION: AI TRANSPARENCY */}
                        <section className="mb-20">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                    <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-3xl  text-gray-900 dark:text-white m-0">
                                    AI Transparency & Disclosure Policy
                                </h2>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold">1. Use of Artificial Intelligence</h3>
                                    <p>Niena uses AI to analyze resumes, recommend jobs, and conduct simulated interviews with feedback on communication metrics.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">2. Nature of AI Output</h3>
                                    <p className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border-l-4 border-amber-500 italic">
                                        AI-generated insights are automated, probabilistic, and based on patterns. They should be treated as <span className="font-bold">guidance</span>, not professional or hiring advice.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">3. No Human Guarantee</h3>
                                    <p>AI interview avatars are <span className="font-bold">not human recruiters</span> and their feedback is not an employer's opinion.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">4. User Responsibility</h3>
                                    <p>Users remain fully responsible for resume accuracy, interview performance, and hiring decisions.</p>
                                </div>
                            </div>
                        </section>

                        <hr className="my-20 border-gray-200 dark:border-gray-800" />

                        {/* SECTION: RECRUITER CODE */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                                    <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-3xl  text-gray-900 dark:text-white m-0">
                                    Recruiter Code of Conduct
                                </h2>
                            </div>

                            <div className="space-y-8">
                                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300 mt-0">1. Ethical Hiring</h3>
                                    <p className="mb-0 text-emerald-800 dark:text-emerald-400">
                                        Recruiters must post only genuine job opportunities with truthful descriptions and avoid misleading details.
                                    </p>
                                </div>

                                <div className="p-6 bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                    <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mt-0">2. Prohibited Conduct</h3>
                                    <ul className="text-red-800 dark:text-red-400 space-y-2 mb-0 mt-2 list-disc pl-5">
                                        <li>No fake or scam listings</li>
                                        <li>No requesting payments from candidates</li>
                                        <li>No harvesting data for non-hiring purposes</li>
                                        <li>No unlawful discrimination</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold">3. Data Protection & Verification</h3>
                                    <p>Recruiters must protect candidate confidentiality and submit valid business documents when requested.</p>
                                </div>

                                <div className="p-6 bg-gray-900 rounded-2xl text-white">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mt-0">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        4. Enforcement
                                    </h3>
                                    <p className="mb-0 text-gray-300 text-sm">
                                        Violation may result in listing removal, account suspension, or legal action.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="mt-20 p-8 bg-blue-600 rounded-3xl text-white text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    <a href="mailto:support@nienalabs.com" className="text-white hover:underline text-lg">support@nienalabs.com</a>
                                </div>
                                <p className="text-blue-100 text-sm max-w-md mx-auto">
                                    These policies are subject to updates and are legally binding when using Niena services.
                                </p>
                            </div>
                        </section>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default PrivacyPage
