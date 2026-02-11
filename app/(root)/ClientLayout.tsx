"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { NotificationListener } from "@/components/notifications/NotificationListener"
import { PlanStatus } from "@/components/shared/PlanStatus"


import Link from "next/link"
import { useSession } from "@/auth-client"
import { Building2, ShieldCheck as Shield_Check } from "lucide-react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()


  return (
    <SidebarProvider>
      <NotificationListener />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />


            {/* Role-based Dashboard Links */}
            {(session?.user as any)?.role === 'recruiter' && (
              <Link
                href="/recruiters/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Visit Recruiter Dashboard
              </Link>
            )}
            {(session?.user as any)?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Shield_Check className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}

          </div>
          <div className="flex items-center gap-2">
            <PlanStatus />
            <NotificationBell />
          </div>
        </header>
        <main className="w-full overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
