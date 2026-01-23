"use client";

import { useMemo, useState } from "react";
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
import { FeatureGuide } from "@/components/FeatureGuide";
import { cn } from "@/lib/utils";

export default function JobSearchClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "recent">("match");
  const [filterRemote, setFilterRemote] = useState<"all" | "remote" | "onsite">("all");

  const { data, isPending, isError } = trpc.jobs.getReccommendedJobs.useQuery({
    page: currentPage,
    limit: 15,
    searchTerm: searchTerm || undefined,
    filterRemote,
    sortBy,
  }, {
    placeholderData: (previousData: any) => previousData, // Maintain UI during page transitions
  });

  const jobsArray = (Array.isArray(data) ? data : []) as (Job & { total_count: bigint })[];
  const totalCount = Number(jobsArray[0]?.total_count || 0);
  const totalPages = Math.ceil(totalCount / 15);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + 4);

      if (end === totalPages) {
        start = totalPages - 4;
      } else if (start === 1) {
        end = 5;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page on filter change
  };

  // States
  if (isPending && !data) {
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

  return (
    <div className="space-y-8 animate-in fade-in font-sans duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Recommended Jobs
            </h2>
            <FeatureGuide
              title="AI Matching"
              description="Jobs are ranked based on a semantic analysis of your resume skills, experience, and the job requirements."
              className="ml-2"
            />
          </div>
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{totalCount}</span> matches based on your profile
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 lg:pb-0">
            <Select
              value={filterRemote}
              onValueChange={(value: "all" | "remote" | "onsite") => {
                setFilterRemote(value);
                handleFilterChange();
              }}
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
              onValueChange={(value: "match" | "recent") => {
                setSortBy(value);
                handleFilterChange();
              }}
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
      <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity", isPending && "opacity-50")}>
        {jobsArray.map((job) => (
          <div key={job.id} className="h-full">
            <JobCard job={job} />
          </div>
        ))}
      </div>

      {jobsArray.length === 0 && !isPending && (
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
            setCurrentPage(1);
          }}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12 py-4 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1 mx-4">
            {pageNumbers[0] > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => handlePageChange(1)}
                  disabled={isPending}
                >
                  1
                </Button>
                {pageNumbers[0] > 2 && <span className="text-muted-foreground px-1">...</span>}
              </>
            )}

            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "ghost"}
                size="sm"
                className="w-9 h-9 p-0"
                onClick={() => handlePageChange(pageNum)}
                disabled={isPending}
              >
                {pageNum}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="text-muted-foreground px-1">...</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={isPending}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isPending}
          >
            Next
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Page {currentPage} of {totalPages} ({totalCount} jobs total)
        </p>
      )}
    </div>
  );
}
