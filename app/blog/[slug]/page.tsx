import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Linkedin, Twitter, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import { createCaller } from "@/trpc/server-caller";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { SocialShareButtons } from "@/components/blog/SocialShareButtons";

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
        <article className="min-h-screen bg-black text-white pb-32 selection:bg-indigo-500/30">
            <ReadingProgressBar />

            {/* Header / Hero */}
            <div className="relative pt-32 pb-16 overflow-hidden">
                {/* Dynamic Ambient Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full animate-pulse duration-[10s]" />
                    <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full animate-blob" />
                </div>

                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all mb-12 group"
                    >
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        </div>
                        <span className="text-sm font-medium">Back to Insights</span>
                    </Link>

                    {/* TOP Cover Image */}
                    {coverImage && imagePosition === "TOP" && (
                        <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] group">
                            <Image src={coverImage} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                    )}

                    <div className="space-y-8">
                        <Badge className="bg-white/5 text-indigo-400 border-white/10 px-4 py-1.5 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase">
                            {category.replace('_', ' ')}
                        </Badge>

                        <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.05] font-syne bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 pt-4 text-white/40 text-sm border-b border-white/5 pb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-indigo-400 font-syne">
                                    {authorName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white/90 leading-none">{authorName}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-white/30 pt-1 font-bold">Author</span>
                                </div>
                            </div>

                            <div className="h-4 w-px bg-white/10 hidden md:block" />

                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-400/60" />
                                <span className="text-white/60">{format(new Date(createdAt), "MMMM d, yyyy")}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400/60" />
                                <span className="text-white/60">{readTime || '5 min read'}</span>
                            </div>

                            <div className="ml-auto hidden sm:flex items-center gap-3">
                                <SocialShareButtons title={title} url={`https://app.nienalabs.com/blog/${slug}`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 max-w-4xl">
                {/* BOTTOM Cover Image */}
                {coverImage && imagePosition === "BOTTOM" && (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-16 border border-white/10 shadow-2xl group">
                        <Image src={coverImage} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                )}

                <MarkdownRenderer content={content} />

                {/* Content Section */}
                <MarkdownRenderer content={content} />

                {/* Company Socials & Further Reading */}
                <div className="mt-32 pt-16 border-t border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="max-w-md">
                            <h2 className="text-3xl font-bold font-syne tracking-tight mb-4 italic">Get more from Niena</h2>
                            <p className="text-white/50 leading-relaxed mb-6">
                                Join our community of forward-thinking professionals. Follow us for daily insights, career strategies, and AI updates.
                            </p>
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://www.linkedin.com/company/niena-labs/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all group"
                                    title="Follow on LinkedIn"
                                >
                                    <Linkedin className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                                </a>
                                <a
                                    href="https://x.com/LabsNiena86233"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all group"
                                    title="Follow on Twitter (X)"
                                >
                                    <Twitter className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                                </a>
                                <a
                                    href="https://instagram.com/nienalabs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all group"
                                    title="Follow on Instagram"
                                >
                                    <Instagram className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-6">
                            <span className="text-sm font-bold tracking-widest uppercase text-white/20">Spread the light</span>
                            <SocialShareButtons
                                title={title}
                                url={`https://app.nienalabs.com/blog/${slug}`}
                                className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-32 text-center pb-20">
                    <Link href="/blog" className="inline-flex items-center gap-3 text-indigo-400 hover:text-indigo-300 font-syne font-bold text-lg group transition-all">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1" />
                        Explore more insights from our journal
                    </Link>
                </div>
            </div>
        </article>
    );
}
