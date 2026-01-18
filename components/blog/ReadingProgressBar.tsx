"use client";

import { useEffect, useState } from "react";

/**
 * Reading Progress Bar
 * Displays a fixed progress bar at the top of the page that follows scroll depth.
 */
export function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight > 0) {
                setProgress((window.scrollY / scrollHeight) * 100);
            }
        };

        window.addEventListener("scroll", updateProgress);
        updateProgress();

        return () => window.removeEventListener("scroll", updateProgress);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-white/5">
            <div
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
