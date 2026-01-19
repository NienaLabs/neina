"use client";

import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Premium Markdown Renderer
 * Renders markdown content with elegant typography for the Niena blog.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-invert prose-lg max-w-none prose-premium", className)}>
            <ReactMarkdown
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-3xl md:text-5xl font-bold mt-12 mb-6 text-white leading-tight font-syne tracking-tight">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-2xl md:text-3xl font-bold mt-10 mb-5 text-white/90 leading-snug font-syne tracking-tight border-l-4 border-indigo-500 pl-4 py-1">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-white/80 leading-snug font-syne tracking-tight">
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p className="mb-6 text-white/80 leading-relaxed text-lg md:text-xl font-light">
                            {children}
                        </p>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-bold text-white tracking-wide">
                            {children}
                        </strong>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-6 space-y-3 list-none">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-6 space-y-3 list-decimal list-inside text-white/70">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="flex items-start gap-3 text-white/70 text-lg">
                            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <span>{children}</span>
                        </li>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="my-10 p-8 bg-indigo-500/5 border-l-2 border-indigo-500 rounded-r-2xl italic text-indigo-100 text-xl font-light leading-relaxed">
                            {children}
                        </blockquote>
                    ),
                    code: ({ children }) => (
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-300">
                            {children}
                        </code>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-500/30 underline-offset-4 font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
