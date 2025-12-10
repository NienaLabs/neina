"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { NotificationListener } from "@/components/notifications/NotificationListener"

import Link from "next/link"
import { useSession } from "@/auth-client"
import { Building2, ShieldCheck as Shield_Check } from "lucide-react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  return (
    <SidebarProvider>
      <NotificationListener />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Role-based Dashboard Links */}
            {session?.user?.role === 'recruiter' && (
              <Link
                href="/recruiters/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Recruiter Dashboard
              </Link>
            )}
            {session?.user?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Shield_Check className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}

          </div>
          <NotificationBell />
        </header>
        <main>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
