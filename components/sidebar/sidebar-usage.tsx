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
      {isPaid && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {timeLeftString}
              </span>
           </div>
           {showRenew && (
               <Button 
                variant="outline" 
                size="sm" 
                className="h-6 px-2 text-xs border-primary/50 hover:bg-primary/10 hover:text-primary"
                onClick={handleRenew}
                disabled={isRenewing}
               >
                 {isRenewing ? <Loader2 className="h-3 w-3 animate-spin"/> : "Renew"}
               </Button>
           )}
        </div>
      )}
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            <span>Resume Credits</span>
          </div>
          <span className="font-bold text-foreground">{user.resume_credits}</span>
        </div>
        {/* Optional Progress Bar if we had a plan limit context */}
      </div>

       <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Interview Mins</span>
          </div>
          <span className="font-bold text-foreground">{user.interview_minutes}</span>
        </div>
      </div>
    </div>
  );
}
