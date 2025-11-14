"use client"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Layout({children}:{children:React.ReactNode}) {    
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
                 <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
        <main>
        {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
