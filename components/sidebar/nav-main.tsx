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
    <SidebarMenu className="flex-1 justify-between gap-2 py-4">
      {items.map((item) => {
        // If user is recruiter and clicking Recruiter link, go to dashboard
        let url = item.url
        if (item.title === "Recruiter" && session?.user?.role === "recruiter") {
          url = "/recruiters/dashboard" // Redirect to recruiter dashboard
        }

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
                asChild 
                isActive={clientPathname === url}
                className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-bold transition-all duration-200"
            >
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
