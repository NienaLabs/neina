"use client";

import { BlogTable } from "@/components/admin/BlogTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AdminBlogPage() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/admin/blog/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Post
                        </Link>
                    </Button>
                </div>
            </div>
            <BlogTable />
        </div>
    );
}
