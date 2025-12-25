"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";

interface BlogEditorProps {
    postId?: string;
}

export function BlogEditor({ postId }: BlogEditorProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        category: "GENERAL" as "GENERAL" | "DEVELOPERS" | "JOB_HUNT" | "CHANGELOGS",
        authorName: "Admin",
        readTime: "",
        published: false,
        coverImage: "",
        imagePosition: "TOP",
        metaTitle: "",
        metaDescription: "",
    });

    const { data: post, isLoading: isFetching } = trpc.blog.getAdminPostById.useQuery(
        { id: postId! },
        { enabled: !!postId }
    );

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt || "",
                category: post.category,
                authorName: post.authorName,
                readTime: post.readTime || "",
                published: post.published,
                coverImage: post.coverImage || "",
                imagePosition: post.imagePosition,
                metaTitle: post.metaTitle || "",
                metaDescription: post.metaDescription || "",
            });
        }
    }, [post]);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-");
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData((prev) => ({
            ...prev,
            title,
            slug: postId ? prev.slug : slugify(title),
        }));
    };

    const createMutation = trpc.blog.createPost.useMutation({
        onSuccess: () => {
            toast.success("Post created successfully");
            router.push("/admin/blog");
        },
        onError: (err) => toast.error(err.message),
    });

    const updateMutation = trpc.blog.updatePost.useMutation({
        onSuccess: () => {
            toast.success("Post updated successfully");
            router.push("/admin/blog");
        },
        onError: (err) => toast.error(err.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (postId) {
            updateMutation.mutate({ id: postId, ...formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (postId && isFetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/blog">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {postId ? "Edit Post" : "Create New Post"}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {(createMutation.isPending || updateMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="mr-2 h-4 w-4" />
                        Save Post
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    placeholder="Enter post title"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="post-url-slug"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content (Markdown supported)</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="min-h-[400px] font-mono"
                                    placeholder="Write your story..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt / Summary</Label>
                                <Textarea
                                    id="excerpt"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    placeholder="Short summary for listings..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Publish Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="published">Published</Label>
                                <Switch
                                    id="published"
                                    checked={formData.published}
                                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GENERAL">General</SelectItem>
                                        <SelectItem value="DEVELOPERS">Developers</SelectItem>
                                        <SelectItem value="JOB_HUNT">Job Hunt</SelectItem>
                                        <SelectItem value="CHANGELOGS">Changelogs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="authorName">Author Name</Label>
                                <Input
                                    id="authorName"
                                    value={formData.authorName}
                                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="readTime">Read Time (e.g., 5 min read)</Label>
                                <Input
                                    id="readTime"
                                    value={formData.readTime}
                                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Featured Image</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="coverImage">Image URL</Label>
                                <Input
                                    id="coverImage"
                                    value={formData.coverImage}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imagePosition">Image Position</Label>
                                <Select
                                    value={formData.imagePosition}
                                    onValueChange={(val) => setFormData({ ...formData, imagePosition: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TOP">Top (Above Header)</SelectItem>
                                        <SelectItem value="BOTTOM">Bottom (Below Header)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
