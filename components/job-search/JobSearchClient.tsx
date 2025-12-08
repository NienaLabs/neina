"use client";

import  { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { parseISO, isValid } from "date-fns";
import JobCard, { Job } from "./JobCard";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[300px] rounded-xl border border-border/50 bg-muted/20 p-4 space-y-4">
            <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500">
            <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold">Error Loading Jobs</h3>
        <p className="text-muted-foreground max-w-md">
          We encountered an error while loading job recommendations. Please
          refresh the page to try again.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  if (jobsArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Search className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold">No Jobs Found</h3>
        <p className="text-muted-foreground max-w-md">
          We couldn&apos;t find any jobs matching your profile. Try updating your resume with more skills or experience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in font-sans duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Recommended Jobs
            </h2>
          </div>
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{filteredJobs.length}</span> matches based on your profile
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 lg:pb-0">
            <Select
              value={filterRemote}
              onValueChange={(value: "all" | "remote" | "onsite") =>
                setFilterRemote(value)
              }
            >
              <SelectTrigger className="w-[160px] h-11 border-border/50 bg-background/50">
                <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="onsite">On-Site Only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value: string) => setSortBy(value)}
            >
              <SelectTrigger className="w-[160px] h-11 border-border/50 bg-background/50">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
            <div key={job.id} className="h-full">
                <JobCard job={job} />
            </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
           <div className="p-4 rounded-full bg-muted text-muted-foreground">
                <Search className="w-8 h-8" />
            </div>
          <h3 className="text-xl font-semibold">No Results Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search filters to see more results.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setFilterRemote("all");
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
