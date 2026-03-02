import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Calendar, ExternalLink, Building2, CheckCircle2, ArrowRight as ArrowRightIcon, Eye } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  overall_similarity?: number;
  viewCount?: number;
  is_recruiter_job?: boolean;
}

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const router = useRouter();
  const postedDate = job.job_posted_at 
    ? job.job_posted_at
    : "Recently";

  const matchScore = Math.round(job.total_similarity * 100);

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
              <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground font-medium truncate">
                    {job.employer_name || "Unknown Company"}
                  </p>
                  {job.is_recruiter_job && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  )}
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center">
             <CircularProgress value={matchScore} size="xs" />
             <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">Match</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {job.is_recruiter_job ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-normal gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
          ) : (
                <Badge variant="outline" className="font-normal gap-1 text-muted-foreground">
                  External
                </Badge>
          )}
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
          <Badge variant="outline" className="font-normal gap-1 text-muted-foreground bg-violet-50/50 border-violet-100">
             <Eye className="w-3 h-3 text-violet-400" />
             {job.viewCount || 0} views
          </Badge>
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
                onClick={() => router.push(`/jobs/${job.id}`)}
            >
                <span className="mr-2">View & Apply</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
