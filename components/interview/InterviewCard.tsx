'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface InterviewCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
  color?: string; // Kept for potential fallback or future use, though not primarily used now
  className?: string;
}

export function InterviewCard({ 
  title, 
  description, 
  image,
  href, 
  className 
}: InterviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    const card = containerRef.current;
    const img = imageRef.current;

    if (!card || !img) return;

    // Create the timeline but pause it initially
    const tl = gsap.timeline({ paused: true });
    
    tl.to(img, {
      scale: 1.15,
      duration: 3,
      ease: "power1.inOut" // Slow, smooth ease
    });

    const handleMouseEnter = () => tl.play();
    const handleMouseLeave = () => tl.reverse();

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      tl.kill();
    };
  }, { scope: containerRef });

  return (
    <Link href={href} className={cn("block h-full", className)}>
      <div ref={containerRef} className="h-full overflow-hidden rounded-xl relative group cursor-pointer border border-border/50">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            ref={imageRef as any}
            src={image}
            alt={title}
            fill
            className="object-cover"
            priority={false}
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 z-10 bg-black/60 transition-opacity duration-300 group-hover:bg-black/70" />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl font-bold text-white mb-2">{title}</CardTitle>
            <CardDescription className="text-white/80 text-base line-clamp-3">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0 mt-auto">
            <div className="flex items-center text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
              Start Interview 
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>
          </CardContent>
        </div>
      </div>
    </Link>
  );
}
