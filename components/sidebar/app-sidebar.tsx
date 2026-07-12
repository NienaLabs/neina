"use client"

import * as React from "react"
import { NavMain } from "@/components/sidebar/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { data } from "@/constants/constant"
import SideBarFooter from "./sidebar-footer"
import Image from 'next/image'
import SidebarUsage from "./sidebar-usage"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        
        <Image src="/logo-black.svg" width={40} height={52} alt="Niena logo" className="h-auto object-contain dark:invert" priority/>
         
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUsage />
        <SideBarFooter/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
