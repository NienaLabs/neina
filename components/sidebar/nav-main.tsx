"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from "@/auth-client"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const pathname = usePathname()
  const [clientPathname, setClientPathname] = useState('')
  const { data: session } = useSession()

  useEffect(() => {
    setClientPathname(pathname)
  }, [pathname])

  return (
    <SidebarMenu>
      {items.map((item) => {
        // If user is recruiter and clicking Recruiter link, go to dashboard
        let url = item.url
        if (item.title === "Recruiter" && session?.user?.role === "recruiter") {
          url = "/recruiters/dashboard" // Redirect to recruiter dashboard
        }

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={clientPathname === url}>
              <Link href={url} className="ml-2">
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
