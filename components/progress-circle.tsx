import React, { useState, useEffect } from 'react';

// --- Type Definitions ---
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CircularProgressProps {
  value: number;
  size?: Size;
}

// --- Utility Functions (Mimicking Shadcn/lib/utils) ---
// Simple class merging utility
const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Mapping for size prop to Tailwind CSS width classes
const SIZE_MAP: Record<Size, string> = {
  xs: 'w-16', // 4rem (64px)
  sm: 'w-24', // 6rem (96px)
  md: 'w-40', // 10rem (160px)
  lg: 'w-64', // 16rem (256px)
  xl: 'w-80', // 20rem (320px)
};

/**
 * Renders a circular progress bar with a customizable gradient stroke.
 */
const CircularProgress: React.FC<CircularProgressProps> = ({ value, size = 'md' }) => {
  // Use a state for smooth animation when the value changes
  const [displayedValue, setDisplayedValue] = useState<number>(0);

  // Animate the value change
  useEffect(() => {
    // Clamp the value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value));
    //eslint-disable-next-line
    setDisplayedValue(clampedValue);
  }, [value]);

  // Radius of the circle stroke
  const radius = 45;
  // Stroke width (Reduced from 10 to 6)
  const strokeWidth = 6;
  // Approximate circumference (2 * pi * radius)
  const circumference = 2 * Math.PI * radius; // Approx 282.74

  // Determine the rotation for the SVG dash offset.
  // Full circle (100%) is a dash offset of 0. Empty (0%) is a dash offset of 'circumference'.
  const strokeDashoffset = circumference - (displayedValue / 100) * circumference;

  // Define color range for text highlight
  const textColor = displayedValue > 80
    ? 'text-green-600' // High
    : displayedValue < 20
    ? 'text-red-500' // Low
    : 'text-blue-500'; // Normal

  // Determine the size class for the container
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  // Determine text size based on component size (heuristic)
  const textSize = size === 'xs' ? 'text-lg'
    : size === 'sm' ? 'text-2xl'
    : size === 'lg' ? 'text-5xl'
    : size === 'xl' ? 'text-6xl'
    : 'text-4xl'; // Default for md


  return (
    // Component size is now controlled by the 'size' prop via the sizeClass
    <div className={cn("relative font-sans aspect-square", sizeClass)}>
      {/* 1. SVG for the Circular Progress Bar */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Define the Gradient */}
        <defs>
          {/* Gradient matching the text color logic: Red (Low) -> Blue (Mid) -> Green (High) */}
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(0 84% 60%)', stopOpacity: 1 }} /> {/* Red for low progress */}
            <stop offset="50%" style={{ stopColor: 'hsl(217 91% 60%)', stopOpacity: 1 }} /> {/* Blue for mid progress */}
            <stop offset="100%" style={{ stopColor: 'hsl(142 71% 45%)', stopOpacity: 1 }} /> {/* Green for high progress */}
          </linearGradient>

         {/* Define a drop shadow filter for aesthetic effect */}
          {/*<filter id="progress-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(22, 163, 74, 0.5)" />
          </filter>*/}
        </defs>

        {/* Track (The background ring) */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress Stroke */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)" // Use the defined gradient
          strokeWidth={strokeWidth}
          strokeLinecap="round" // Gives the ends a rounded appearance
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 0.8s ease-out', // Smooth animation
          }}
          // Apply the shadow effect
          filter="url(#progress-shadow)"
        />
      </svg>

      {/* 2. Centered Text Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <span className={cn(
            'font-extrabold transition-colors duration-500',
            textColor,
            textSize, // Dynamic text size
          )}
        >
          {Math.round(displayedValue)}%
        </span>
      </div>
    </div>
  );
};
export default CircularProgress;