"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Edit, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export function BlogTable() {
    const [search, setSearch] = useState("");
    const { data, isLoading, isError, error } = trpc.blog.getAdminPosts.useQuery({
        search,
        limit: 50,
    });

    const utils = trpc.useUtils();

    const deletePostMutation = trpc.blog.deletePost.useMutation({
        onSuccess: () => {
            utils.blog.getAdminPosts.invalidate();
            toast.success("Blog post deleted successfully");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
            deletePostMutation.mutate({ id });
        }
    };

    if (isError) {
        return <div className="p-4 text-red-500 bg-red-100 rounded-md">Error: {error.message}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : data?.posts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No blog posts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.posts.map((post) => (
                                <TableRow key={post.id} className="group">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{post.title}</span>
                                            <span className="text-xs text-muted-foreground font-normal">/{post.slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {post.category.toLowerCase().replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{post.authorName}</TableCell>
                                    <TableCell>
                                        {post.published ? (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Published</Badge>
                                        ) : (
                                            <Badge variant="secondary">Draft</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/blog/${post.id}`}>
                                                    <Edit className="h-4 w-4 text-slate-600" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(post.id)}
                                                disabled={deletePostMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
