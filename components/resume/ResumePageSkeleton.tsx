import { Skeleton } from "@/components/ui/skeleton";

export function ResumePageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Primary Resumes Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[280px] rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4 flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <div className="flex-1" />
              <div className="flex justify-between items-center border-t border-border/50 pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailored Resumes Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[220px] rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-auto pt-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
              <div className="flex justify-between items-center border-t border-border/50 pt-4 mt-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
