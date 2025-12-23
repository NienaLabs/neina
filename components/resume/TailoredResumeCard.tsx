import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { MoreHorizontal, Edit, Trash2, Star, Briefcase, Calendar, Loader2 } from "lucide-react";
import CircularProgress from "@/components/progress-circle";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { TailoredResume } from './ResumePageClient';
import Link from 'next/link';

interface TailoredResumeCardProps {
  resume: TailoredResume;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
}

const TailoredResumeCard: React.FC<TailoredResumeCardProps> = ({ resume, onSetPrimary, onDelete }) => {
  const scoreData = resume.scores;
  const matchScore = scoreData ? Math.round(scoreData.finalScore * 100) : 0;
  
  const isProcessing = resume.status === 'PENDING' || resume.status === 'PROCESSING';

  return (
    <Card className={cn(
        "group relative overflow-hidden border-border/50 bg-linear-to-br from-background to-muted/20 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full",
        isProcessing && "pointer-events-none opacity-80"
    )}>
       {/* Processing Overlay */}
       {isProcessing && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
           <Loader2 className="h-8 w-8 text-primary animate-spin" />
           <p className="text-xs font-semibold text-primary mt-2 animate-pulse">Processing...</p>
         </div>
       )}

      {/* Top Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-linear-to-r",
        matchScore >= 80 ? "from-green-500 to-emerald-400" :
        matchScore >= 50 ? "from-blue-500 to-cyan-400" :
        "from-orange-500 to-red-400"
      )} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header: Title, Match Score */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-3 items-start flex-1 min-w-0">
            <div className="relative shrink-0 w-10 h-10 rounded-lg border bg-background flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
               <Briefcase className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <Link href={`/resume/edit/${resume.id}`} className="block">
                <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors hover:underline decoration-primary/50 underline-offset-4" title={resume.name}>
                    {resume.name}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground font-medium truncate mt-0.5">
                {resume.role || "General Role"}
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center">
             <CircularProgress value={matchScore} size="xs" />
             <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">Match</span>
          </div>
        </div>

        {/* Score Breakdown */}
        {scoreData && (
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md border border-border/30">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">Content</span>
              <span className="text-sm font-bold text-foreground">{Math.round(scoreData.overallScore * 100)}%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md border border-border/30">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">Skills</span>
              <span className="text-sm font-bold text-foreground">{Math.round(scoreData.skillsScore * 100)}%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md border border-border/30">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">Exp</span>
              <span className="text-sm font-bold text-foreground">{Math.round(scoreData.experienceScore * 100)}%</span>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}</span>
            
            <div className="ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/resume/edit/${resume.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetPrimary(resume.id)}>
                        <Star className="mr-2 h-4 w-4" />
                        Set as Primary
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => onDelete(resume.id)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default TailoredResumeCard;
