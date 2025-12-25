import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { createCaller } from "@/trpc/server-caller";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const caller = await createCaller();
        const post = await caller.blog.getPostBySlug({ slug });

        const postUrl = `https://app.nienalabs.com/blog/${post.slug}`;
        const ogImage = post.coverImage || "/og-image.jpg";
        const metaTitle = post.metaTitle || post.title;
        const metaDescription = post.metaDescription || post.excerpt || "Read this insightful article on Niena's blog.";

        return {
            title: metaTitle,
            description: metaDescription,
            keywords: ["niena", "blog", post.category.toLowerCase(), "career", "ai", "job search"],
            authors: [{ name: post.authorName }],
            creator: post.authorName,
            openGraph: {
                type: "article",
                locale: "en_US",
                url: postUrl,
                title: metaTitle,
                description: metaDescription,
                siteName: "Niena",
                publishedTime: post.createdAt.toISOString(),
                modifiedTime: post.updatedAt.toISOString(),
                authors: [post.authorName],
                images: [
                    {
                        url: ogImage,
                        width: 1200,
                        height: 630,
                        alt: post.title,
                    }
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: metaTitle,
                description: metaDescription,
                creator: "@nienalabs",
                images: [ogImage],
            },
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
        };
    } catch (error) {
        return {
            title: "Post Not Found",
            description: "The requested blog post could not be found.",
        };
    }
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;

    let post;
    try {
        const caller = await createCaller();
        post = await caller.blog.getPostBySlug({ slug });
    } catch (error) {
        notFound();
    }

    const {
        title,
        content,
        coverImage,
        imagePosition,
        authorName,
        readTime,
        category,
        createdAt
    } = post;

    return (
        <article className="min-h-screen bg-black text-white pb-32">
            {/* Header / Hero */}
            <div className="relative pt-32 pb-16 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
                </div>

                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Blog
                    </Link>

                    {/* TOP Cover Image */}
                    {coverImage && imagePosition === "TOP" && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
                            <Image src={coverImage} alt={title} fill className="object-cover" priority />
                        </div>
                    )}

                    <div className="space-y-6">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1">
                            {category.replace('_', ' ')}
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 pt-4 text-white/40 text-sm border-b border-white/10 pb-8">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-indigo-400">
                                    {authorName.charAt(0)}
                                </div>
                                <span className="font-medium text-white/80">{authorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(createdAt), "MMMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {readTime || '5 min read'}
                            </div>
                            <button className="ml-auto flex items-center gap-2 hover:text-white transition-colors">
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 max-w-4xl">
                {/* BOTTOM Cover Image (Legacy naming but user meant "below header") */}
                {coverImage && imagePosition === "BOTTOM" && (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
                        <Image src={coverImage} alt={title} fill className="object-cover" />
                    </div>
                )}

                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed text-white/80 text-lg md:text-xl">
                        {content}
                    </div>
                </div>

                {/* Footer of the article */}
                <div className="mt-20 pt-10 border-t border-white/10">
                    <div className="bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Enjoyed this post?</h3>
                            <p className="text-white/60">Help others by sharing this insight with your network.</p>
                        </div>
                        <Button className="rounded-full px-8 py-6 bg-white text-black hover:bg-white/90">
                            Share Article
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
