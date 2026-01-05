"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AdminSectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * A reusable section header for Admin pages.
 */
export function AdminSectionHeader({ title, description, action, className }: AdminSectionHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8", className)}>
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight font-syne text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="text-muted-foreground text-lg font-light">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="flex items-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
}
