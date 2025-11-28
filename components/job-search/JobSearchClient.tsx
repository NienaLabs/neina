"use client";

import  { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Briefcase, ExternalLink, Search, Globe } from "lucide-react";
import { parseISO, isValid } from "date-fns";

interface Job {
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

const getMatchScoreColor = (score: number): "high" | "medium" | "low" => {
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
};

const formatScore = (score: number) => Math.round(score * 100);

export default function JobSearchClient() {
  const { data, isPending, isError } = trpc.jobs.getReccommendedJobs.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [filterRemote, setFilterRemote] = useState<
    "all" | "remote" | "onsite"
  >("all");

  const jobsArray = (Array.isArray(data) ? data : []) as Job[];

  const filteredJobs = useMemo(() => {
    let result = [...jobsArray];

    // Filter remote
    if (filterRemote !== "all") {
      result = result.filter((job) =>
        filterRemote === "remote"
          ? job.job_is_remote === true
          : job.job_is_remote === false
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      result = result.filter((job) => {
        return (
          job.job_title?.toLowerCase().includes(term) ||
          job.employer_name?.toLowerCase().includes(term) ||
          job.job_location?.toLowerCase().includes(term)
        );
      });
    }

    // Sorting
    if (sortBy === "recent") {
      result = [...result].sort((a, b) => {
        const dateA = a.job_posted_at && isValid(parseISO(a.job_posted_at))
          ? parseISO(a.job_posted_at).getTime()
          : 0;

        const dateB = b.job_posted_at && isValid(parseISO(b.job_posted_at))
          ? parseISO(b.job_posted_at).getTime()
          : 0;

        return dateB - dateA;
      });
    } else {
      result = [...result].sort(
        (a, b) => b.total_similarity - a.total_similarity
      );
    }

    return result;
  }, [jobsArray, searchTerm, sortBy, filterRemote]);

  // States
  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Briefcase className="w-8 h-8 mx-auto mb-3 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading job recommendations...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="empty-state py-12">
        <h3 className="empty-state-title">Error Loading Jobs</h3>
        <p className="empty-state-description">
          We encountered an error while loading job recommendations. Please
          refresh the page.
        </p>
      </div>
    );
  }

  if (jobsArray.length === 0) {
    return (
      <div className="empty-state py-12">
        <h3 className="empty-state-title">No Jobs Found</h3>
        <p className="empty-state-description">
          Try uploading or updating your resume.
        </p>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="w-6 h-6 text-primary" />
          <h2 className="text-headline-md">Recommended Jobs</h2>
        </div>
        <p className="text-body-sm text-muted-foreground">
          {filteredJobs.length} of {jobsArray.length} jobs match your profile
        </p>
      </div>

      {/* Filters */}
      <div className="filter-container border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Remote Filter */}
            <Select
              value={filterRemote}
              onValueChange={(value: "all" | "remote" | "onsite") =>
                setFilterRemote(value)
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="onsite">On-Site Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select
              value={sortBy}
              onValueChange={(value: string) => setSortBy(value)}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="jobs-grid mt-6">
        {filteredJobs.map((job) => {
          const matchColor = getMatchScoreColor(job.total_similarity);
          const matchPercent = formatScore(job.total_similarity);

          const postedDate =
            job.job_posted_at 
              ? job.job_posted_at
              : "Unknown date";

          return (
            <Card key={job.id} className="job-card group">
              <div className="job-card-header">
                <div className="flex-1 min-w-0">
                  <div className="job-card-title">
                    {job.employer_logo&&<Image width={50} className="rounded-full border" alt="logo" height={50} src={job.employer_logo}/>}
                    {job.job_title || "Untitled Role"}
                  </div>
                  <p className="job-card-company">
                    {job.employer_name || "Unknown Company"}
                  </p>

                  {/* Meta */}
                  <div className="job-card-meta">
                    {job.job_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.job_location}
                      </span>
                    )}
                    {job.job_is_remote && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Remote
                      </span>
                    )}
                    <span>{postedDate}</span>
                  </div>
                </div>

                <div
                  className={`match-score-badge match-score-${matchColor} shrink-0`}
                >
                  {matchPercent}%
                </div>
              </div>

              <div className="my-4 py-3 border-t border-b border-border/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-label">Skills Match</span>
                    <p className="text-base font-semibold mt-1">
                      {formatScore(job.skill_similarity)}%
                    </p>
                  </div>

                  <div>
                    <span className="text-label">Responsibilities Match</span>
                    <p className="text-base font-semibold mt-1">
                      {formatScore(job.responsibility_similarity)}%
                    </p>
                  </div>
                </div>
              </div>

              {job.job_description && (
                <p className="text-body-sm line-clamp-3 mb-4 text-muted-foreground">
                  {job.job_description}
                </p>
              )}

              <Button
                variant="default"
                size="sm"
                className="w-full"
                disabled={!job.job_apply_link}
                onClick={() =>
                  job.job_apply_link &&
                  window.open(job.job_apply_link, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View & Apply
              </Button>
            </Card>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="empty-state py-12">
          <h3 className="empty-state-title">No Results Found</h3>
          <p className="empty-state-description">
            Try adjusting your search filters.
          </p>
        </div>
      )}
    </div>
  );
}
