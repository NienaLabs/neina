"use client";

import { AlertTriangle, Mail, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function SuspendedPage() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/auth/sign-in");
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
                        </div>

                        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                            Account Suspended
                        </h1>

                        <p className="mt-4 text-muted-foreground">
                            Your account has been temporarily suspended. This may be due to:
                        </p>

                        <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>Violation of our Terms of Service</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>Suspicious or unusual account activity</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>Pending security review</span>
                            </li>
                        </ul>

                        <div className="mt-6 w-full rounded-lg bg-muted p-4">
                            <p className="text-sm font-medium text-foreground">
                                Need help?
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                If you believe this is a mistake or would like to appeal this decision,
                                please contact our support team.
                            </p>
                        </div>

                        <div className="mt-6 flex w-full flex-col gap-3">
                            <Button asChild size="lg" variant="default" className="w-full">
                                <Link href="mailto:support@nienalabs.com">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Contact Support
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleSignOut}
                                className="w-full"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
