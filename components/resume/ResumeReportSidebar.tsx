import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react"
import { Fixes, Fix } from "./editor/types"

interface ResumeReportSidebarProps {
  fixes: Fixes
}

export function ResumeReportSidebar({ fixes }: ResumeReportSidebarProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600'
      case 'urgent':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'low':
        return 'bg-yellow-500 hover:bg-yellow-600'
      default:
        return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
      default:
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  const renderFixes = (sectionFixes: Fix[]) => {
    if (!sectionFixes || sectionFixes.length === 0) return null

    return (
      <div className="space-y-4">
        {sectionFixes.map((fix, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-2 bg-card">
            <div className="flex items-center justify-between gap-2">
              <Badge className={`${getSeverityColor(fix.severity)} text-white border-none flex items-center gap-1`}>
                {getSeverityIcon(fix.severity)}
                <span className="capitalize">{fix.severity}</span>
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{fix.issue}</p>
              <p className="text-sm text-muted-foreground">{fix.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderSection = (key: string, content: Fix[] | Record<string, Fix[]>) => {
    if (Array.isArray(content)) {
      if (content.length === 0) return null
      return (
        <div key={key} className="space-y-3">
          <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
            {key.replace(/([A-Z])/g, ' $1').trim()}
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
              {content.length}
            </Badge>
          </h3>
          {renderFixes(content)}
        </div>
      )
    } else {
      // Handle nested sections (like experience entries)
      const hasIssues = Object.values(content).some(arr => arr.length > 0)
      if (!hasIssues) return null

      return (
        <div key={key} className="space-y-3">
          <h3 className="font-semibold text-lg capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <div className="pl-4 border-l-2 space-y-4">
            {Object.entries(content).map(([subKey, subFixes]) => {
              if (subFixes.length === 0) return null
              return (
                <div key={subKey} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground capitalize">
                    {subKey.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  {renderFixes(subFixes)}
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  const totalIssues = Object.values(fixes).reduce((acc, curr) => {
    if (Array.isArray(curr)) {
      return acc + curr.length
    }
    return acc + Object.values(curr).reduce((subAcc, subCurr) => subAcc + subCurr.length, 0)
  }, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full rounded-full border-muted-foreground/20" size="sm">
          View Report
          {totalIssues > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
              {totalIssues}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-hidden flex flex-col h-full">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-2xl">Resume Report</SheetTitle>
          <SheetDescription>
            Found {totalIssues} issues that need your attention to improve your resume score.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 w-full rounded-md min-h-0">
          <div className="flex flex-col gap-8 p-4">
            {Object.entries(fixes).map(([key, content]) => renderSection(key, content))}
            
            {totalIssues === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Great Job!</h3>
                  <p className="text-muted-foreground">No issues found in your resume.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
