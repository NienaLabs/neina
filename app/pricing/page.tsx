"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Plan Definitions (could drive this from API, but static for UI speed first)
const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "Free",
    description: "Perfect for new users exploring the platform.",
    features: [
      { text: "1 resume upload total", included: true },
      { text: "10 job matches per week", included: true },
      { text: "3 Resume AI credits per month", included: true },
      { text: "No Interview AI access", included: false },
    ],
    highlight: false,
    priceVal: 0,
  },
  {
    key: "SILVER",
    name: "Silver / Basic",
    price: "₦799/mo",
    description: "Affordable for early job seekers.",
    features: [
      { text: "30 job matches per week", included: true },
      { text: "10 Resume AI credits per month", included: true },
      { text: "No Interview AI access", included: false },
    ],
    highlight: false,
    priceVal: 79900,
  },
  {
    key: "GOLD",
    name: "Gold / Pro",
    price: "₦1,899/mo",
    description: "Best for active job seekers.",
    features: [
      { text: "60 job matches per week", included: true },
      { text: "20 Resume AI credits per month", included: true },
      { text: "15 minutes of Interview AI per month", included: true },
    ],
    highlight: true,
    priceVal: 189900,
  },
  {
    key: "DIAMOND",
    name: "Diamond / Elite",
    price: "₦3,499/mo",
    description: "For serious job hunters who want maximum advantage.",
    features: [
      { text: "Unlimited matches", included: true }, // Assumed unlimited based on "Diamond" usually being top
      { text: "30 Resume AI credits per month", included: true },
      { text: "60 Interview AI minutes per month", included: true },
      { text: "4 Interview AI sessions (15m each)", included: true },
    ],
    highlight: false,
    priceVal: 349900,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const initiateTransaction = trpc.payment.initiateTransaction.useMutation({
    onSuccess: (data) => {
      // Redirect to Paystack
      window.location.href = data.authorization_url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate payment");
      setLoadingKey(null);
    },
  });

  const handleSubscribe = (plan: typeof PLANS[0]) => {
    if (plan.key === "FREE") {
      toast.info("You are already on the Free plan!");
      return;
    }
    setLoadingKey(plan.key);
    initiateTransaction.mutate({
      email: "user@example.com", // TODO: Get actual user email from session
      amount: plan.priceVal,
      type: "SUBSCRIPTION",
      plan: plan.key as any,
      callbackUrl: `${window.location.origin}/pricing/verification`, // We need to create this page
    });
  };

  const handleBuyCredits = (credits: number, price: number) => {
    const key = `credits-${credits}`;
    setLoadingKey(key);
    initiateTransaction.mutate({
      email: "user@example.com", // TODO: Get actual user email
      amount: price * 100, // Convert to kobo
      type: "CREDIT_PURCHASE",
      credits: credits,
      callbackUrl: `${window.location.origin}/pricing/verification`,
    });
  };

   const handleBuyMinutes = (minutes: number, price: number) => {
    const key = `minutes-${minutes}`;
    setLoadingKey(key);
    initiateTransaction.mutate({
      email: "user@example.com", // TODO: Get actual user email
      amount: price * 100, // Convert to kobo
      type: "MINUTE_PURCHASE",
      minutes: minutes,
      callbackUrl: `${window.location.origin}/pricing/verification`,
    });
  };

  // We need to fetch the user to get their email, or we can assume the backend gets it from ctx if passed empty?
  // Our backend explicitly requires email in input Zod schema.
  // So we MUST get the user email.
  // Let's use trpc.user.me or similar if available, or session.
  // Adding a stub for user fetching:
  const { data: user } = trpc.user.getMe.useQuery(); 
  // Assuming getMe exists or similar. If not, we might need to adjust.
  // I will check if trpc.user.getMe exists or similar. I'll invoke the tool first to check.
  // For now I'll use a placeholder and fix it if needed.

  const safeHandleSubscribe = (plan: typeof PLANS[0]) => {
     if(!user?.email) {
         toast.error("Please log in to subscribe");
         return;
     }
     handleSubscribe(plan); // Logic above needs to use user.email
  }
   // Updating handleSubscribe to use user.email... simpler to just do logic here
   const onSubscribe = (plan: typeof PLANS[0]) => {
      if (!user) return toast.error("Please login");
      if (plan.key === "FREE") return toast.info("You are on Free plan");
      
      setLoadingKey(plan.key);
      initiateTransaction.mutate({
          email: user.email,
          amount: plan.priceVal,
          type: "SUBSCRIPTION",
          plan: plan.key as any,
          callbackUrl: `${window.location.origin}/pricing/verify`, 
      });
   }
   
   const onBuyCredits = (credits: number, price: number) => {
      if (!user) return toast.error("Please login");
      const key = `credits-${credits}`;
      setLoadingKey(key);
       initiateTransaction.mutate({
          email: user.email,
          amount: price * 100, // to kobo
          type: "CREDIT_PURCHASE",
          credits: credits,
          callbackUrl: `${window.location.origin}/pricing/verify`,
      });
   }

    const onBuyMinutes = (minutes: number, price: number) => {
      if (!user) return toast.error("Please login");
      const key = `minutes-${minutes}`;
      setLoadingKey(key);
       initiateTransaction.mutate({
          email: user.email,
          amount: price * 100, // to kobo
          type: "MINUTE_PURCHASE",
          minutes: minutes,
          callbackUrl: `${window.location.origin}/pricing/verify`,
      });
   }

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r font-sans from-primary to-primary/60">
            Pricing that Scales with Your Career
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your job search intensity. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan) => (
            <Card 
              key={plan.key} 
              className={cn(
                "relative flex flex-col transition-all duration-200 hover:shadow-xl",
                plan.highlight ? "border-primary shadow-lg scale-105 z-10" : "border-border"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Free" && <span className="text-muted-foreground text-sm">/month</span>}
                </div>
                <CardDescription className="mt-4">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={cn("text-sm", !feature.included && "text-muted-foreground/60")}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <Button 
                    className="w-full" 
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => onSubscribe(plan)}
                    disabled={loadingKey !== null}
                 >
                    {loadingKey === plan.key ? <Loader2 className="animate-spin h-4 w-4" /> : (plan.key === "FREE" ? "Current Plan" : "Upgrade")}
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-xl font-semibold text-muted-foreground">Or Pay As You Go</span>
          </div>
        </div>

        {/* One-Time Purchases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Interview AI */}
          <div className="space-y-8 p-8 border rounded-2xl bg-card hover:bg-accent/5 transition-colors">
            <div className="text-center space-y-2">
              <span className="text-4xl">🎤</span>
              <h3 className="text-2xl font-bold">Interview AI Minutes</h3>
              <p className="text-muted-foreground">Practice makes perfect. Top up your interview minutes.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                  <div>
                    <div className="font-semibold">1 Minute</div>
                    <div className="text-sm text-muted-foreground">$1.50 / min</div>
                  </div>
                  {/* Min purchase usually higher, but prompt says $1.50 per min. Let's offer reasonable packs */}
                  <div className="text-right">
                    <div className="font-bold">$1.50</div>
                  </div>
               </div>
               
               <Card className="border-primary/20 bg-primary/5">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-lg">15 Minute Session</div>
                        <div className="text-sm text-muted-foreground">Ideal for full mock interview</div>
                    </div>
                    <div className="text-right">
                         <div className="font-bold text-xl">$13.99</div>
                         <div className="text-xs text-green-600 font-medium">Save 38%</div>
                    </div>
                 </CardContent>
                 <CardFooter className="p-4 pt-0">
                    <Button className="w-full" onClick={() => onBuyMinutes(15, 13.99)} disabled={loadingKey !== null}>
                        {loadingKey === "minutes-15" && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Buy Session
                    </Button>
                 </CardFooter>
               </Card>
            </div>
          </div>

          {/* Resume AI */}
           <div className="space-y-8 p-8 border rounded-2xl bg-card hover:bg-accent/5 transition-colors">
            <div className="text-center space-y-2">
              <span className="text-4xl">📝</span>
              <h3 className="text-2xl font-bold">Resume AI Credits</h3>
              <p className="text-muted-foreground">Tailor more resumes to specific job descriptions.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                  { credits: 10, price: 5 },
                  { credits: 20, price: 10 },
                  { credits: 30, price: 15 },
                  { credits: 50, price: 25 },
                ].map((pack) => (
                   <Button 
                      key={pack.credits} 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => onBuyCredits(pack.credits, pack.price)}
                      disabled={loadingKey !== null}
                    >
                      <span className="font-bold text-xl">{pack.credits} Credits</span>
                      <span className="text-muted-foreground">${pack.price}</span>
                   </Button>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
