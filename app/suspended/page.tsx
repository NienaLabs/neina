"use client";

import { AlertTriangle, Mail, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth-client";
import { useRouter } from "next/navigation";

export default function SuspendedPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Account Suspended
            </h1>

            <p className="mt-4 max-w-sm text-lg text-muted-foreground">
                Your account has been suspended due to a violation of our terms of service or suspicious activity.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" variant="default">
                    <Link href="mailto:support@jobai.com">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Support
                    </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={async () => {
                    await signOut();
                    router.push("/auth/sign-in");
                }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
