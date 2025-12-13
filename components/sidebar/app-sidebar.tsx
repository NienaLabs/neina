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
import Image from 'next/image'
import SidebarUsage from "./sidebar-usage"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0 bg-linear-to-b from-sidebar via-indigo-200 to-sidebar" {...props}>
      <SidebarHeader>
        
        <Image src="/logo.png" width={100} height={30} alt="logo"/>
         
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="mt-auto">
             <SidebarUsage />
             <SideBarFooter/>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
