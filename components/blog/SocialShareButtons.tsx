"use client";

import { useState } from "react";
import { Twitter, Linkedin, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialShareButtonsProps {
    title: string;
    url: string;
    className?: string;
}

/**
 * Social Share Buttons
 * Functional sharing for Twitter, LinkedIn and clipboard.
 */
export function SocialShareButtons({ title, url, className = "" }: SocialShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const shareOnTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                onClick={shareOnTwitter}
                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all text-white/60 hover:text-white"
                title="Share on Twitter"
            >
                <Twitter className="w-4 h-4" />
            </button>
            <button
                onClick={shareOnLinkedIn}
                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all text-white/60 hover:text-white"
                title="Share on LinkedIn"
            >
                <Linkedin className="w-4 h-4" />
            </button>
            <button
                onClick={copyToClipboard}
                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all text-white/60 hover:text-white"
                title="Copy link"
            >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    );
}
