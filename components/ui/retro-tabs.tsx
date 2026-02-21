"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const RetroTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    tabs: { id: string; label: string; icon?: React.ReactNode; disabled?: boolean }[]
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
    <TabsPrimitive.List className="flex items-center gap-1 bg-transparent px-4 pb-2 overflow-x-auto min-w-0">
      {tabs.map((tab) => (
        <TabsPrimitive.Trigger
          key={tab.id}
          value={tab.id}
          disabled={tab.disabled}
          title={tab.label}
          className={cn(
            "relative -mb-[2px] rounded-xl px-3 py-2 font-mono text-xs font-bold uppercase transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 whitespace-nowrap",
            "data-[state=active]:tab-active data-[state=active]:bg-white data-[state=active]:text-primary-purple",
            "hover:not-disabled:bg-white/50"
          )}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          <span className={tab.icon ? "hidden xl:inline" : ""}>{tab.label}</span>
        </TabsPrimitive.Trigger>
      ))}
    </TabsPrimitive.List>
  </TabsPrimitive.Root>
))
RetroTabs.displayName = "RetroTabs"

export { RetroTabs }
