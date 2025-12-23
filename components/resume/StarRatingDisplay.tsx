"use client";

import React, { useRef } from "react";
import { Star } from "lucide-react";
import CircularProgress from "@/components/progress-circle";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface StarRatingDisplayProps {
  rating: number;
  label: string;
  score?: number; // 0-100 score, if available (mainly for Primary resumes)
}

export const StarRatingDisplay = ({ rating, label, score }: StarRatingDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<(SVGSVGElement | null)[]>([]);

  useGSAP(
    () => {
      // Animate stars: Jump and scale from 0
      gsap.from(starsRef.current, {
        y: 20,
        scale: 0,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center gap-4">
      {/* Score Display (Circular Progress) */}
      {score !== undefined && (
        <div className="flex flex-col items-center">
            <CircularProgress value={score} size="xs" />
        </div>
      )}

      {/* Star Rating */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star, index) => (
            <Star
              key={star}
              ref={(el) => {
                if (el) starsRef.current[index] = el;
              }}
              className={`w-8 h-8 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};
