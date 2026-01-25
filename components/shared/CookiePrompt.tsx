"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * CookiePrompt Component
 * Displays a fixed bottom banner to notify users about cookie usage.
 * Persists user's acknowledgement in localStorage.
 */
export const CookiePrompt = () => {
    const [isVisible, setIsVisible] = useState(false)
    const pathname = usePathname()

    // Hide prompt on auth screens
    const isAuthPage = pathname?.startsWith("/auth")

    useEffect(() => {
        // Check if user has already acknowledged the cookie notice
        const hasAcknowledged = localStorage.getItem("cookie-consent-acknowledged")

        if (!hasAcknowledged) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAcknowledge = () => {
        localStorage.setItem("cookie-consent-acknowledged", "true")
        // Set a persistent cookie for server-side detection if needed (1 year)
        document.cookie = "niena-cookie-consent=true; path=/; max-age=" + (60 * 60 * 24 * 365)
        setIsVisible(false)
    }

    if (isAuthPage) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl"
                >
                    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-6 shadow-2xl">
                        {/* Background Gradient Effect */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transform rotate-3">
                                <Cookie className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-grow text-center md:text-left">
                                <h3 className="text-lg font-bold font-syne text-gray-900 dark:text-white mb-1">
                                    We use cookies! 🍪
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    We use cookies to enhance your experience and analyze site traffic.
                                    Read our <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Privacy Policy</Link> to learn more.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                                <Button
                                    size="sm"
                                    onClick={handleAcknowledge}
                                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 font-syne px-8 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>

                        <button
                            onClick={handleAcknowledge}
                            className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
