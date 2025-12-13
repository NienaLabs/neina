import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
        // If checking for admin specifically and want to just redirect home:
        // if (request.nextUrl.pathname.startsWith("/admin")) { ... }

        // Otherwise, standard redirect to sign-in
        const redirectTo = request.nextUrl.pathname + request.nextUrl.search
        return NextResponse.redirect(
            new URL(`/auth/sign-in?redirectTo=${redirectTo}`, request.url)
        )
    }

    // Check if user is suspended
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({ headers: request.headers });

    if (session?.user) {
        const prisma = (await import("@/lib/prisma")).default;
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isSuspended: true }
        });

        if (user?.isSuspended) {
            return NextResponse.redirect(
                new URL("/auth/sign-in?error=suspended", request.url)
            );
        }
    }

    return NextResponse.next()
}

export const config = {
    // Protected routes
    matcher: ["/account/settings", "/dashboard","/interview-ai","/job-search","/onboarding","/resume", "/api/trpc", "/admin/:path*"]
}