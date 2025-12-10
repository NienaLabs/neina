"use client";

import { useSession } from "@/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function SuspensionGuard({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (session?.user?.isSuspended) {
            if (pathname !== "/suspended") {
                router.push("/suspended");
            }
        } else {
            // If user is NOT suspended but tries to visit /suspended, redirect to dashboard or home
            if (pathname === "/suspended") {
                router.push("/dashboard");
            }
        }
    }, [session, pathname, router]);

    // If suspended and on suspended page, render content
    // If suspended and NOT on suspended page, render nothing (blocking) until redirect
    // If NOT suspended, render children

    if (session?.user?.isSuspended && pathname !== "/suspended") {
        return null; // Or a loading spinner while redirecting
    }

    return <>{children}</>;
}
