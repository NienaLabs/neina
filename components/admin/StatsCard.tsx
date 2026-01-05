"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface StatsCardProps {
    title: string;
    total: string;
    icon: React.ReactNode;
    trend?: string;
    className?: string;
}

/**
 * Standardized StatsCard for the Admin Dashboard.
 */
export function StatsCard({ title, total, icon, trend, className }: StatsCardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
            className
        )}>
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/60 transition-colors group-hover:text-primary/70">
                        {title}
                    </p>
                    <h4 className="text-3xl font-bold font-syne text-foreground tracking-tight">
                        {total}
                    </h4>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 icon-glow">
                    {icon}
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground/70 bg-secondary/50 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                </div>
            )}

            {/* Subtle decorative background element */}
            <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        </div>
    );
}
