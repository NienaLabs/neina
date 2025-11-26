"use client";
import React from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function JobSearchClient() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.jobs.getReccommendedJobs.useQuery(undefined, {
    // run automatically on mount
    enabled: true,
  });

  return (
    <div className="py-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Recommended Jobs (test)</h3>
          <Button onClick={() => void refetch()}>Refetch</Button>
        </div>

        {isLoading && <div>Loading recommended jobs…</div>}

        {isError && (
          <div className="text-sm text-red-600">
            <strong>Error:</strong>
            <div>{String(error?.message ?? "Unknown error")}</div>
          </div>
        )}

        {data && (
          <pre className="mt-3 max-h-[480px] overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
        )}

        {!isLoading && !isError && !data && (
          <div className="text-sm text-muted-foreground">No recommendations yet.</div>
        )}
      </Card>
    </div>
  );
}
