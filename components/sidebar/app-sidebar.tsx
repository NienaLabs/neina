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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0 bg-linear-to-b from-transparent via-violet-200 to-transparent" {...props}>
      <SidebarHeader>
        
        <Image src="/logo.png" width={100} height={50} alt="logo"/>
         
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SideBarFooter/>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
