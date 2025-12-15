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
    price: "$29/mo",
    description: "Affordable for early job seekers.",
    features: [
      { text: "30 job matches per week", included: true },
      { text: "10 Resume AI credits per month", included: true },
      { text: "No Interview AI access", included: false },
    ],
    highlight: false,
    priceVal: 2900,
  },
  {
    key: "GOLD",
    name: "Gold / Pro",
    price: "$49/mo",
    description: "Best for active job seekers.",
    features: [
      { text: "60 job matches per week", included: true },
      { text: "20 Resume AI credits per month", included: true },
      { text: "15 minutes of Interview AI per month", included: true },
    ],
    highlight: true,
    priceVal: 4900,
  },
  {
    key: "DIAMOND",
    name: "Diamond / Elite",
    price: "$99/mo",
    description: "For serious job hunters who want maximum advantage.",
    features: [
      { text: "Unlimited matches", included: true },
      { text: "30 Resume AI credits per month", included: true },
      { text: "60 Interview AI minutes per month", included: true },
      { text: "4 Interview AI sessions (15m each)", included: true },
    ],
    highlight: false,
    priceVal: 9900,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  
  // Fetch user data
  const { data: user, refetch } = trpc.user.getMe.useQuery(); 

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

  const cancelSubscription = trpc.payment.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled. You are now on the Free plan.");
      setLoadingKey(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel subscription");
      setLoadingKey(null);
    },
  });

   const onSubscribe = (plan: typeof PLANS[0]) => {
      if (!user) return toast.error("Please login");
      if (plan.key === user.plan) return; // Already on plan
      
      setLoadingKey(plan.key);
      initiateTransaction.mutate({
          email: user.email,
          amount: plan.priceVal,
          type: "SUBSCRIPTION",
          plan: plan.key as any,
          callbackUrl: `${window.location.origin}/pricing/verify?from=/pricing`, 
      });
   }
   
   const onCancelPlan = () => {
      if (!confirm("Are you sure you want to cancel your current plan? You will lose remaining benefits immediately.")) return;
      setLoadingKey("cancel");
      cancelSubscription.mutate();
   }

   const onBuyCredits = (credits: number, price: number) => {
      if (!user) return toast.error("Please login");
      const key = `credits-${credits}`;
      setLoadingKey(key);
       initiateTransaction.mutate({
          email: user.email,
          amount: price * 100, // to cents
          type: "CREDIT_PURCHASE",
          credits: credits,
          callbackUrl: `${window.location.origin}/pricing/verify?from=/pricing`,
      });
   }

    const onBuyMinutes = (minutes: number, price: number) => {
      if (!user) return toast.error("Please login");
      const key = `minutes-${minutes}`;
      setLoadingKey(key);
       initiateTransaction.mutate({
          email: user.email,
          amount: Math.round(price * 100), // to cents
          type: "MINUTE_PURCHASE",
          minutes: minutes,
          callbackUrl: `${window.location.origin}/pricing/verify?from=/pricing`,
      });
   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-violet-950/10 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/10 dark:bg-violet-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10 space-y-20">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the perfect plan for your job search journey. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PLANS.map((plan) => {
             const isCurrentPlan = user?.plan === plan.key;
             return (
            <div 
              key={plan.key} 
              className={cn(
                "group relative",
                plan.highlight && "md:scale-105 md:-translate-y-2"
              )}
            >
              {/* Glass card */}
              <div className={cn(
                "relative h-full backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border rounded-3xl shadow-xl transition-all duration-300",
                plan.highlight 
                  ? "border-indigo-200 dark:border-indigo-800/50 shadow-indigo-100/50 dark:shadow-indigo-900/20" 
                  : "border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600",
                "hover:shadow-2xl",
                isCurrentPlan && "ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950"
              )}>
                {/* Badge */}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg">
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && !plan.highlight && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg">
                    Current Plan
                  </div>
                )}
                
                <div className="p-8 space-y-8">
                  {/* Header */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <div>
                      <span className="text-5xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                      {plan.price !== "Free" && <span className="text-slate-600 dark:text-slate-400 text-lg">/mo</span>}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{plan.description}</p>
                  </div>
                  
                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className={cn(
                          "shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                          feature.included 
                            ? "bg-emerald-500/10 dark:bg-emerald-500/20" 
                            : "bg-slate-200/50 dark:bg-slate-700/50"
                        )}>
                          {feature.included ? (
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                          ) : (
                            <X className="h-3 w-3 text-slate-400 dark:text-slate-600" strokeWidth={2} />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm",
                          feature.included 
                            ? "text-slate-700 dark:text-slate-300" 
                            : "text-slate-500 dark:text-slate-500 line-through"
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Buttons */}
                  <div className="space-y-3 pt-4">
                     <Button 
                        className={cn(
                          "w-full font-medium transition-all duration-200",
                          isCurrentPlan 
                            ? "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white" 
                            : plan.highlight
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg hover:shadow-xl"
                              : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900"
                        )}
                        onClick={() => onSubscribe(plan)}
                        disabled={loadingKey !== null || isCurrentPlan || (plan.key === "FREE" && user?.plan !== "FREE")}
                     >
                        {loadingKey === plan.key ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : plan.key === "FREE" ? (
                          "Get Started"
                        ) : (
                          "Upgrade"
                        )}
                     </Button>
                     
                     {isCurrentPlan && plan.key !== "FREE" && (
                         <Button 
                            variant="ghost"
                            className="w-full text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={onCancelPlan}
                            disabled={loadingKey !== null}
                         >
                            {loadingKey === "cancel" ? <Loader2 className="animate-spin h-4 w-4" /> : "Cancel Plan"}
                         </Button>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-300 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-violet-950/10 px-6 text-xl font-semibold text-slate-600 dark:text-slate-400">
              Or Buy Credits
            </span>
          </div>
        </div>

        {/* One-Time Purchases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Interview AI */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
            <div className="text-center space-y-3 mb-8">
              <div className="text-5xl">🎤</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Interview AI Minutes</h3>
              <p className="text-slate-600 dark:text-slate-400">Practice makes perfect</p>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">1 Minute</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">$1.50 / min</div>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">$1.50</div>
               </div>
               
               <div className="border-2 border-violet-200 dark:border-violet-800/50 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white">15 Minutes</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Full mock interview</div>
                    </div>
                    <div className="text-right">
                         <div className="font-bold text-2xl text-slate-900 dark:text-white">$13.99</div>
                         <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Save 38%</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium shadow-lg" 
                    onClick={() => onBuyMinutes(15, 13.99)} 
                    disabled={loadingKey !== null}
                  >
                    {loadingKey === "minutes-15" && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    Buy Session
                  </Button>
               </div>
            </div>
          </div>

          {/* Resume AI */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
            <div className="text-center space-y-3 mb-8">
              <div className="text-5xl">📝</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Resume AI Credits</h3>
              <p className="text-slate-600 dark:text-slate-400">Tailor unlimited resumes</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[
                  { credits: 10, price: 5 },
                  { credits: 20, price: 10 },
                  { credits: 30, price: 15 },
                  { credits: 50, price: 25 },
                ].map((pack) => (
                   <Button 
                      key={pack.credits} 
                      variant="outline"
                      className="h-auto py-5 flex flex-col gap-2 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                      onClick={() => onBuyCredits(pack.credits, pack.price)}
                      disabled={loadingKey !== null}
                    >
                      <span className="font-bold text-xl text-slate-900 dark:text-white">{pack.credits}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">${pack.price}</span>
                   </Button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
