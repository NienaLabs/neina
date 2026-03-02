"use client";

import { useState } from "react";
import {
    Twitter,
    Linkedin,
    Copy,
    Check,
    Share2,
    MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn, triggerShare } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface JobShareActionsProps {
    jobTitle: string;
    companyName: string;
    url: string;
    variant?: "compact" | "default" | "minimal";
    className?: string;
}

/**
 * JobShareActions Component
 * Standardized sharing block for job openings.
 */
export function JobShareActions({
    jobTitle,
    companyName,
    url,
    variant = "default",
    className = ""
}: JobShareActionsProps) {
    const [copied, setCopied] = useState(false);

    const shareText = `Check out this opening for ${jobTitle} at ${companyName}!`;

    const handleShare = async () => {
        const result = await triggerShare({
            title: jobTitle,
            text: shareText,
            url: url
        });

        if (result === 'copied') {
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    };

    const shareOnWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (variant === "minimal") {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className={cn("h-8 w-8 rounded-full", className)}
                title="Share Job"
            >
                <Share2 className="h-4 w-4" />
            </Button>
        );
    }

    if (variant === "compact") {
        return (
            <div className={cn("flex items-center gap-1.5", className)}>
                <Button variant="outline" size="icon" onClick={shareOnLinkedIn} className="h-9 w-9 rounded-xl" title="Share on LinkedIn">
                    <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                </Button>
                <Button variant="outline" size="icon" onClick={shareOnWhatsApp} className="h-9 w-9 rounded-xl" title="Share on WhatsApp">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                </Button>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-9 w-9 rounded-xl">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-3", className)}>
            <Button
                variant="outline"
                className="rounded-2xl border-indigo-100 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all font-semibold"
                onClick={handleShare}
            >
                <Share2 className="mr-2 h-4 w-4" /> Share Opening
            </Button>

            <div className="flex items-center gap-2 border-l pl-3 ml-1">
                <button
                    onClick={shareOnLinkedIn}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#0A66C2]"
                    title="LinkedIn"
                >
                    <Linkedin className="w-5 h-5 fill-current" />
                </button>
                <button
                    onClick={shareOnWhatsApp}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#25D366]"
                    title="WhatsApp"
                >
                    <MessageCircle className="w-5 h-5" />
                </button>
                <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
                    title="Copy Link"
                >
                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
