"use client"

import { type LucideIcon } from "lucide-react"
import {usePathname} from 'next/navigation'
import {useState,useEffect} from 'react'
import Link from 'next/link'
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
  const [clientPathname,setClientPathname] = useState('')

  useEffect(() => {
    setClientPathname(pathname)
  }, [pathname])

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={clientPathname===item.url}>
            <Link href={item.url} className="ml-2">
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
