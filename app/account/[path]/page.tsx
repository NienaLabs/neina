import { AccountView } from "@daveyplate/better-auth-ui"
import { PushNotificationManager } from '@/components/notifications/PushNotificationManager';
import { accountViewPaths } from "@daveyplate/better-auth-ui/server"

export const dynamicParams = false

export function generateStaticParams() {
    return Object.values(accountViewPaths).map((path) => ({ path }))
}

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = await params

    return (
        <main className="container max-w-5xl mx-auto py-10 px-4 md:px-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings, preferences, and notifications.
                </p>
            </div>

            <div className="grid gap-8">
                {/* Account Management Section */}
                <section className="space-y-4">
                    <AccountView path={path} />
                </section>

                <div className="border-t pt-8">
                    <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Notifications</h2>
                            <p className="text-sm text-muted-foreground">
                                Choose how you want to be notified about job matches and updates.
                            </p>
                        </div>
                        <div className="w-full">
                            <PushNotificationManager />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
