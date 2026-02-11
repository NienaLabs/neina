"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const RetroTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    tabs: { id: string; label: string; disabled?: boolean }[]
    activeTab: string
    onTabChange: (id: string) => void
  }
>(({ className, tabs, activeTab, onTabChange, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn("flex flex-col", className)}
    value={activeTab}
    onValueChange={onTabChange}
    {...props}
  >
    <TabsPrimitive.List className="flex items-center gap-2 border-b-2 border-black bg-[#E5E5E0] px-4 pb-0">
      {tabs.map((tab) => (
        <TabsPrimitive.Trigger
          key={tab.id}
          value={tab.id}
          disabled={tab.disabled}
          className={cn(
            "relative -mb-[2px] border-2 border-transparent px-4 py-2 font-mono text-sm font-bold uppercase transition-all disabled:opacity-50",
            "data-[state=active]:border-black data-[state=active]:bg-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "hover:not-disabled:text-blue-700"
          )}
        >
          {tab.label}
        </TabsPrimitive.Trigger>
      ))}
    </TabsPrimitive.List>
  </TabsPrimitive.Root>
))
RetroTabs.displayName = "RetroTabs"

export { RetroTabs }
