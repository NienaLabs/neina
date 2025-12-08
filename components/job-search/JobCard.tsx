import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Calendar, ExternalLink, Building2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import CircularProgress from "../progress-circle";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export interface Job {
  id: string;
  job_title: string | null;
  employer_name: string | null;
  employer_logo: string | null;
  job_apply_link: string | null;
  job_location: string | null;
  job_is_remote: boolean | null;
  job_description: string | null;
  job_posted_at: string | null;
  skill_similarity: number;
  responsibility_similarity: number;
  total_similarity: number;
}

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const postedDate = job.job_posted_at 
    ? job.job_posted_at
    : "Recently";

  const matchScore = Math.round(job.total_similarity * 100);
  const skillsScore = Math.round(job.skill_similarity * 100);
  const respScore = Math.round(job.responsibility_similarity * 100);

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
      {/* Top Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
        matchScore >= 80 ? "from-green-500 to-emerald-400" :
        matchScore >= 50 ? "from-blue-500 to-cyan-400" :
        "from-orange-500 to-red-400"
      )} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header: Logo, Title, Match Score */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-3 items-start flex-1 min-w-0">
            <div className="relative shrink-0 w-12 h-12 rounded-xl border bg-background flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              {job.employer_logo ? (
                <Image 
                  src={job.employer_logo} 
                  alt={job.employer_name || "Employer"} 
                  width={48} 
                  height={48} 
                  className="object-contain p-1"
                />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors" title={job.job_title || ""}>
                {job.job_title || "Untitled Role"}
              </h3>
              <p className="text-sm text-muted-foreground font-medium truncate">
                {job.employer_name || "Unknown Company"}
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center">
             <CircularProgress value={matchScore} size="xs" />
             <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">Match</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {job.job_location && (
            <Badge variant="secondary" className="bg-muted/50 hover:bg-muted font-normal gap-1">
              <MapPin className="w-3 h-3" />
              {job.job_location}
            </Badge>
          )}
          {job.job_is_remote && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 font-normal gap-1">
              <Globe className="w-3 h-3" />
              Remote
            </Badge>
          )}
          <Badge variant="outline" className="font-normal gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {postedDate}
          </Badge>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-dashed border-border/60">
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Skills</span>
                    <span className={cn("font-bold", skillsScore > 70 ? "text-green-600" : "text-muted-foreground")}>{skillsScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                            skillsScore > 70 ? "bg-green-500" : skillsScore > 40 ? "bg-blue-500" : "bg-orange-400"
                        )} 
                        style={{ width: `${skillsScore}%` }} 
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Responsibility</span>
                    <span className={cn("font-bold", respScore > 70 ? "text-blue-600" : "text-muted-foreground")}>{respScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                            respScore > 70 ? "bg-blue-500" : respScore > 40 ? "bg-indigo-500" : "bg-yellow-400"
                        )} 
                        style={{ width: `${respScore}%` }} 
                    />
                </div>
            </div>
        </div>

        {/* Description Snippet */}
        {job.job_description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {job.job_description}
          </p>
        )}

        <div className="mt-auto pt-2">
            <Button 
                className="w-full group-hover:bg-primary  hover:bg-primary group-hover:text-primary-foreground hover:text-primary-foreground transition-all shadow-sm" 
                variant="outline"
                onClick={() => job.job_apply_link && window.open(job.job_apply_link, "_blank", "noopener,noreferrer")}
                disabled={!job.job_apply_link}
            >
                <span className="mr-2">View & Apply</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
