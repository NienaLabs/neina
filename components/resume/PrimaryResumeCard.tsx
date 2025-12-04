'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Resume } from '@/lib/generated/prisma/client'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Edit, Trash2, PlusCircle,CircleStar } from 'lucide-react'
import { format } from 'date-fns'
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
  const scoreData =
    typeof resume.scoreData === 'string'
      ? (JSON.parse(resume.scoreData) as ScoreData)
      : resume.scoreData
  const overallScore = scoreData?.scores?.overallScore ?? null
  const utils = trpc.useUtils()

  const deleteResumeMutation = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.getPrimaryResumes.invalidate()
      toast.success("resume deleted successfully")
    },
    onError:(e) => {
      toast.error("An error occured: "+e)
    }
  })
  const router = useRouter()

  return (
    <Card
      className={cn(
        'cursor-pointer  transition-all duration-300 border-2',
        isSelected
          ? 'shadow-lg'
          : 'hover:shadow-md'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 dark:text-white truncate">
            {resume.name}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={()=>router.push(`/resume/edit/${resume.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateTailored(resume.id)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Tailored
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => deleteResumeMutation.mutate({ resumeId: resume.id })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {format(new Date(resume.createdAt), 'MMM dd, yyyy')}
          </span>

          {overallScore !== null ? (
            <Badge
              className={cn(
                'font-bold',
                overallScore >= 8
                  ? 'bg-green-100 text-green-800'
                  : 'bg-indigo-100 text-indigo-800'
              )}
            >
              Score: {overallScore.toFixed(1)}/10
              <CircleStar/>
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">No Score</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PrimaryResumeCard
