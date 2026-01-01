import type { Metadata } from 'next'
import ClientLayout from './ClientLayout'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  if (!(session.user as any).onboardingCompleted) {
    redirect("/onboarding");
  }

  return <ClientLayout>{children}</ClientLayout>
}
