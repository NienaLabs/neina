"use client";

import { useSession } from "@/auth-client"; // Adjust path if needed
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

export function PlanStatus() {
  const router = useRouter();
  // We can use trpc.user.getMe or useSession. 
  // useSession is client-side auth state, might be faster but less rich? 
  // Let's use trpc for consistent fresh data or useSession if it has Plan.
  // The User model has 'plan' field. Let's check if useSession includes it.
  // Usually auth-client session includes basic user info. 
  // To be safe and real-time (after upgrade), let's use trpc which we can invalidate.
  
  const { data: user, isLoading } = trpc.user.getMe.useQuery(undefined, {
      staleTime: 1000 * 60 * 5, // 5 mins cache
  });

  if (isLoading) {
    return <div className="h-8 w-20 bg-muted/20 animate-pulse rounded" />;
  }

  if (!user) return null;

  const isFree = user.plan === "FREE";

  if (isFree) {
    return (
      <Button 
        size="sm" 
        variant="outline" 
        className="gap-2 bg-linear-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50 hover:border-yellow-500 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
        onClick={() => router.push("/pricing")}
      >
        <Crown className="h-4 w-4 text-yellow-500" />
        Upgrade
      </Button>
    );
  }

  // Formatting Plan Name
  const formatPlan = (plan: string) => {
      // capitalize first letter
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
  }

  return (
    <Button variant="outline"  onClick={() => router.push("/pricing")} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50 hover:cursor-pointer">
        <Crown className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
            {formatPlan(user.plan)} Plan
        </span>
    </Button>
  );
}
