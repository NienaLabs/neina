'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Resume } from '@/lib/generated/prisma/client'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Edit, Trash2, PlusCircle, Star, FileText, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { trpc } from '@/trpc/client'
import {useRouter} from 'next/navigation'
import { toast } from 'sonner'


// ✅ Define your score type
type ScoreData = {
  scores: {
    profile: number
    education: number
    experience: number
    projects: number
    skills: number
    certifications: number
    awards: number
    publications: number
    overallScore: number
  }
  customSections: {
    sectionName: string
    score: number
    remarks: string
  }[]
}

// ✅ Extend the Resume type with a properly typed scoreData
type ResumeWithScore = Resume & {
  scoreData: ScoreData | null
}

const PrimaryResumeCard = ({
  resume,
  isSelected,
  onSelect,
  onCreateTailored,
}: {
  resume: ResumeWithScore
  isSelected: boolean
  onSelect: () => void
  onCreateTailored: (resumeId: string) => void
}) => {
  const utils = trpc.useUtils()

  const deleteResumeMutation = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.getPrimaryResumes.invalidate()
      toast.success("Resume deleted successfully")
    },
    onError:(e) => {
      toast.error("An error occured: "+e)
    }
  })
  const router = useRouter()

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 border-border/50 bg-gradient-to-br from-background to-muted/20 h-full flex flex-col',
        isSelected
          ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
          : 'hover:shadow-xl hover:border-primary/20 hover:scale-[1.01]'
      )}
      onClick={onSelect}
    >
       {/* Top Accent Line */}
       <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-400",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
      )} />

      <div className="p-5 flex flex-col h-full gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                        {resume.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e)=>{ e.stopPropagation(); router.push(`/resume/edit/${resume.id}`)}}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateTailored(resume.id)}}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Tailored
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="text-red-500"
                    onClick={(e) => { e.stopPropagation(); deleteResumeMutation.mutate({ resumeId: resume.id })}}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Star Rating based on Issues */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality Score</span>
            {(() => {
                const analysisData = resume.analysisData;
                
                interface AnalysisData {
                    fixes: Record<string, unknown>;
                    [key: string]: unknown;
                }

                const parsedAnalysisData = analysisData ? (typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData) as AnalysisData : { fixes: {} };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { fixes, ...fixCountRaw } = parsedAnalysisData;
                const fixCount = fixCountRaw as Record<string, number>;
                
                // Calculate total issues
                const totalIssues = Object.values(fixCount).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);

                // Determine Star Rating based on issues
                let starRating = 0;
                if (totalIssues < 10) starRating = 5;
                else if (totalIssues < 20) starRating = 4;
                else if (totalIssues < 30) starRating = 3;
                else if (totalIssues < 40) starRating = 2;
                else starRating = 1;

                return (
                <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-full">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                        "h-3.5 w-3.5",
                        star <= starRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                    />
                    ))}
                </div>
                );
            })()}
        </div>
      </div>
    </Card>
  )
}

export default PrimaryResumeCard
