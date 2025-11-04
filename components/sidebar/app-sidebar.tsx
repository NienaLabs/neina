"use client"

import * as React from "react"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { data } from "@/constants/constant"
import SideBarFooter from "./sidebar-footer"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <h1>Job AI</h1>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary}/> 
        <SideBarFooter/>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
