"use client"

import * as React from "react"
import { NavMain } from "@/components/sidebar/nav-main"
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
    <Sidebar className="border-r-0 bg-linear-to-b from-transparent via-violet-200 to-transparent" {...props}>
      <SidebarHeader>
        <h1 className="ml-2">Job AI</h1>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SideBarFooter/>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
