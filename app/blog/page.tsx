"use client";

import { trpc } from "@/trpc/client";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Calendar, Clock, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["ALL", "GENERAL", "DEVELOPERS", "JOB_HUNT", "CHANGELOGS"];

export default function BlogListingPage() {
    const [category, setCategory] = useState<any>("ALL");
    const { data, isLoading } = trpc.blog.getPosts.useQuery({
        category,
        limit: 20,
    });

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full" />
                    <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full" />
                </div>

                <div className="container mx-auto px-4 text-center">
                    <Badge variant="outline" className="mb-4 border-indigo-500/30 text-indigo-400 bg-indigo-500/5 px-4 py-1">
                        Our Journal
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Insights & Updates
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Stay ahead in your career with expert advice, developer insights, and the latest from the Niena team.
                    </p>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                                    category === cat
                                        ? "bg-white text-black border-white"
                                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {cat.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="container mx-auto px-4 pb-32">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    </div>
                ) : data?.posts.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-white/40 text-xl font-medium">No posts found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data?.posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            >
                                {/* image */}
                                <div className="relative h-64 overflow-hidden">
                                    {post.coverImage ? (
                                        <Image
                                            src={post.coverImage}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                                            <div className="w-20 h-20 bg-white/10 rounded-2xl blur-sm" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white font-medium">
                                            {post.category.toLowerCase().replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-white/40 text-xs mb-4">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(post.createdAt), "MMM d, yyyy")}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {post.readTime || '5 min read'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-white/50 text-sm leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt || 'No summary available for this post.'}
                                    </p>
                                    <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                <User className="w-3 h-3 text-indigo-400" />
                                            </div>
                                            <span className="text-xs text-white/60 font-medium">{post.authorName}</span>
                                        </div>
                                        <div className="group/btn flex items-center gap-1 text-xs font-semibold text-white/40 group-hover:text-white transition-colors">
                                            Read More
                                            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
