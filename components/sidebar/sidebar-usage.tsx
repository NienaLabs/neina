"use client";

import { trpc } from "@/trpc/client";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Zap, Clock, CalendarDays } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PLAN_PRICES: Record<string, number> = {
  SILVER: 2900,
  GOLD: 4900,
  DIAMOND: 9900,
};

export default function SidebarUsage() {
  const { data: user, isLoading } = trpc.user.getMe.useQuery();
  const [isRenewing, setIsRenewing] = useState(false);

  const initiateTransaction = trpc.payment.initiateTransaction.useMutation({
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate renewal");
      setIsRenewing(false);
    },
  });

  if (isLoading || !user) return null;

  const isPaid = user.plan !== "FREE";
  const now = new Date();
  const expiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : new Date();
  
  const totalHoursLeft = isPaid && user.planExpiresAt 
    ? differenceInHours(expiresAt, now)
    : 0;

  const days = Math.floor(totalHoursLeft / 24);
  const hours = totalHoursLeft % 24;

  let timeLeftString = "Suscription expired";
  if (totalHoursLeft > 0) {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (parts.length === 0) timeLeftString = "Renews soon"; 
    else timeLeftString = `Renews in ${parts.join(' ')}`;
  }
  
  const showRenew = totalHoursLeft <= 24;

  const handleRenew = () => {
    if (!user.plan || user.plan === "FREE") return;
    const price = PLAN_PRICES[user.plan];
    if (!price) {
      toast.error("Could not determine plan price");
      return;
    }

    setIsRenewing(true);
    initiateTransaction.mutate({
      email: user.email,
      amount: price,
      type: "SUBSCRIPTION",
      plan: user.plan as "SILVER" | "GOLD" | "DIAMOND",
      callbackUrl: `${window.location.origin}/pricing/verify?from=/dashboard`,
    });
  };

  return (
    <div className="px-2 py-4 space-y-4">
      <div className=" bg-linear-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50 p-3 rounded-lg text-xs leading-relaxed text-muted-foreground border  space-y-3">
        <p>
          You have <span className="font-bold text-amber-600 dark:text-amber-500">{user.resume_credits}</span> resume credits and {user.interview_minutes > 0 ? (
            <>
              <span className="font-bold text-indigo-600 dark:text-indigo-500">{user.interview_minutes}</span> interview minutes
            </>
          ) : (
            <span className="font-semibold text-foreground">no</span>
          )} interview minutes remaining.
        </p>

        {isPaid && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
             <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                <CalendarDays className="h-3 w-3" />
                <span className="font-medium text-[10px]">
                  {timeLeftString}
                </span>
             </div>
             {showRenew && (
                 <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 px-2 text-[10px] hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30"
                  onClick={handleRenew}
                  disabled={isRenewing}
                 >
                   {isRenewing ? <Loader2 className="h-2 w-2 animate-spin"/> : "Renew"}
                 </Button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
