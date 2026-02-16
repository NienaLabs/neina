
import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let session = null;
    try {
        session = await auth.api.getSession({
            headers: await headers()
        });
    } catch (error) {
        console.error("❌ [AdminLayout] Failed to get session:", error);
    }

    if (!session || (session.user as any).role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-boxdark-2">
            {/* Sidebar */}
            <Sidebar />

            {/* Content Area */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <div className="lg:pl-0 pl-16">
                    <Header />
                </div>

                {/* Main Content */}
                <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
