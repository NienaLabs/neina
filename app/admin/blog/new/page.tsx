"use client";

import { BlogEditor } from "@/components/admin/BlogEditor";

export default function AdminNewBlogPost() {
    return (
        <div className="flex-1 space-y-4">
            <BlogEditor />
        </div>
    );
}
