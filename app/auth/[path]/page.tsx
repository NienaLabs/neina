import { AuthView } from "@daveyplate/better-auth-ui"
import { authViewPaths } from "@daveyplate/better-auth-ui/server"

export const dynamicParams = false

export function generateStaticParams() {
    return Object.values(authViewPaths).map((path) => ({ path }))
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = await params

    return (
        <main className="flex grow jigsaw-background min-h-screen flex-col items-center justify-center  p-4 md:p-6">
            <AuthView path={path} className="bg-indigo-100 border-black/30 " redirectTo="/onboarding" />
            <p className="text-xs text-center text-muted-foreground mt-4 max-w-sm">
                By signing up or signing in, you accept our <a href="/terms" className="underline hover:text-primary">Terms of Service</a> and <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
            </p>
        </main>
    )
}