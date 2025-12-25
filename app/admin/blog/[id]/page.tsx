"use client";

import { BlogEditor } from "@/components/admin/BlogEditor";
import { use } from "react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AdminEditBlogPost({ params }: PageProps) {
    const { id } = use(params);

    return (
        <div className="flex-1 space-y-4">
            <BlogEditor postId={id} />
        </div>
    );
}
