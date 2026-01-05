"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AdminCardProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
    headerAction?: React.ReactNode;
}

/**
 * A reusable card component for the Admin Panel with a luxury minimalist aesthetic.
 */
export function AdminCard({ children, title, description, className, headerAction }: AdminCardProps) {
    return (
        <div className={cn(
            "rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200",
            className
        )}>
            {(title || description || headerAction) && (
                <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            {title && (
                                <h3 className="text-xl font-semibold leading-none tracking-tight font-syne">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {headerAction && (
                            <div>{headerAction}</div>
                        )}
                    </div>
                </div>
            )}
            <div className={cn("p-6 pt-0", !title && "pt-6")}>
                {children}
            </div>
        </div>
    );
}
