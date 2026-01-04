"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Globe, CreditCard, Sparkles, Mic, FileText, Zap, Crown, Shield } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FeatureGuide } from "@/components/FeatureGuide";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Plan Definitions
const PLANS = [
  {
    key: "FREE",
    name: "Starter",
    price: "Free",
    priceUSD: "Free",
    description: "Essential tools to start your journey.",
    features: [
      { text: "Unlimited Job Recommendations", included: true },
      { text: "Free Resume Autofix", included: true },
      { text: "1 resume upload total", included: true },
      { text: "3 Resume AI credits (one-time)", included: true },
      { text: "Interview AI access", included: false },
    ],
    highlight: false,
    priceVal: 0,
    priceValUSD: 0,
    icon: Sparkles
  },
  {
    key: "SILVER",
    name: "Silver",
    price: "₵450",
    priceUSD: "$29",
    period: "/mo",
    description: "Perfect for active job seekers.",
    features: [
      { text: "Unlimited Job Recommendations", included: true },
      { text: "Free Resume Autofix", included: true },
      { text: "10 Resume AI credits per month", included: true },
      { text: "No Interview AI access", included: false },
    ],
    highlight: false,
    priceVal: 450, // GHS
    priceValUSD: 2900, // Cents
    icon: Zap
  },
  {
    key: "GOLD",
    name: "Gold",
    price: "₵750",
    priceUSD: "$49",
    period: "/mo",
    description: "Most popular for ambitious professionals.",
    features: [
      { text: "Unlimited Job Recommendations", included: true },
      { text: "Free Resume Autofix", included: true },
      { text: "20 Resume AI credits per month", included: true },
      { text: "15 mins Interview AI per month", included: true },
    ],
    highlight: true,
    priceVal: 750, // GHS
    priceValUSD: 4900,
    icon: Crown
  },
  {
    key: "DIAMOND",
    name: "Diamond",
    price: "₵1,500",
    priceUSD: "$99",
    period: "/mo",
    description: "Maximum power for serious career moves.",
    features: [
      { text: "Unlimited Job Recommendations", included: true },
      { text: "Free Resume Autofix", included: true },
      { text: "30 Resume AI credits per month", included: true },
      { text: "60 Interview AI mins per month", included: true },
      { text: "4 Interview Sessions (15m each)", included: true },
    ],
    highlight: false,
    priceVal: 1500, // GHS
    priceValUSD: 9900,
    icon: Shield
  },
];

interface PricingClientProps {
  userCountry: string;
  isAfricanUser: boolean;
}

export default function PricingClient({ userCountry, isAfricanUser }: PricingClientProps) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [preferInternational, setPreferInternational] = useState(false);

  const showInternational = !isAfricanUser || preferInternational;
  const { data: user, refetch } = trpc.user.getMe.useQuery(); 

  const initiateTransaction = trpc.payment.initiateTransaction.useMutation({
    onSuccess: (data) => {
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

   const onSubscribe = async (plan: typeof PLANS[0]) => {
      if (!user) return toast.error("Please login to subscribe");
      if (plan.key === user.plan) return; 
      
      setLoadingKey(plan.key);

      if (showInternational) {
          try {
             toast.info("Redirecting to secure checkout...");
             window.location.href = "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_fBWrJLYZACQJtUkpeNWi6IEJqQubKetHMSiHc0F4oYx/redirect";
             setLoadingKey(null);
          } catch (e) {
             toast.error("Failed to start checkout");
             setLoadingKey(null);
          }
      } else {
          initiateTransaction.mutate({
              email: user.email,
              amount: plan.priceVal * 100, 
              type: "SUBSCRIPTION",
              plan: plan.key as any,
              callbackUrl: `${window.location.origin}/pricing/verify?from=/pricing`, 
          });
      }
   }
   
   const onCancelPlan = () => {
      if (!confirm("Are you sure you want to cancel your current plan?")) return;
      setLoadingKey("cancel");
      cancelSubscription.mutate();
   }

   const onBuyCredits = (credits: number, price: number) => {
      if (!user) return toast.error("Please login");
      const key = `credits-${credits}`;
      setLoadingKey(key);
      
      if (showInternational) {
         toast.info("Credit purchase coming soon for international users");
         setLoadingKey(null);
         return;
      }

       initiateTransaction.mutate({
          email: user.email,
          amount: price * 100, 
          type: "CREDIT_PURCHASE",
          credits: credits,
          callbackUrl: `${window.location.origin}/pricing/verify?from=/pricing`,
      });
   }

    const onBuyMinutes = (minutes: number, price: number) => {
      if (!user) return toast.error("Please login");
      const key = `minutes-${minutes}`;
      setLoadingKey(key);

      if (showInternational) {
         toast.info("Minute purchase coming soon for international users");
         setLoadingKey(null);
         return;
      }

       initiateTransaction.mutate({
          email: user.email,
          amount: Math.round(price * 100), 
          type: "MINUTE_PURCHASE",
          minutes: minutes,
          callbackUrl: `${window.location.origin}/pricing/verify?from=/pricing`,
      });
   }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4 sm:px-6 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-100/20 via-slate-50/50 to-slate-100/50 dark:from-indigo-900/10 dark:via-slate-950/50 dark:to-slate-950 -z-10" />
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/40 via-slate-100/20 to-transparent dark:from-indigo-900/40 dark:via-slate-900/20" />
      <div className="absolute top-1/2 -left-64 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob" />
      <div className="absolute top-1/2 -right-64 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-20">
        
        {/* Header Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900 icon-glow">
            Simple Pricing, No Hidden Fees
          </Badge>
          <h1 className="text-4xl md:text-6xl font-syne tracking-tight text-slate-900 dark:text-white leading-tight">
            Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Future Career</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
             Unlock the full potential of Niena with plans designed to accelerate your job search. 
             From smart resume tailoring to AI interview coaching.
          </p>

          {/* Region Toggle */}
          {isAfricanUser && (
             <div className="flex items-center justify-center pt-4">
                <div className="bg-white dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm inline-flex">
                   <button
                     onClick={() => setPreferInternational(false)}
                     className={cn(
                       "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                       !preferInternational 
                         ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md transform scale-105" 
                         : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                     )}
                   >
                      African/Local (GHS)
                   </button>
                   <button
                     onClick={() => setPreferInternational(true)}
                     className={cn(
                       "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                       preferInternational 
                         ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md transform scale-105" 
                         : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                     )}
                   >
                    <span>International (USD)</span>
                  </button>
                </div>
                <FeatureGuide 
                  description="We offer discounted rates in local currency for African users to support access to advanced AI career tools." 
                  className="ml-2 h-4 w-4"
                  side="right"
                />
             </div>
          )}
        </div>

        {/* Subscription Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan) => {
             const isCurrentPlan = user?.plan === plan.key;
             const displayPrice = showInternational ? plan.priceUSD : plan.price;
             const Icon = plan.icon;

             return (
            <Card 
              key={plan.key} 
              className={cn(
                "relative flex flex-col transition-all duration-300 border-2 overflow-hidden",
                plan.highlight 
                  ? "border-indigo-600 dark:border-indigo-500 shadow-2xl scale-105 z-10" 
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl",
                isCurrentPlan && "ring-4 ring-indigo-500/20"
              )}
            >
              {plan.highlight && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              )}
              
              <CardHeader className="pb-8 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className={cn(
                      "p-3 rounded-xl inline-flex",
                      plan.highlight ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {plan.highlight && (
                      <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/30">
                        Most Popular
                      </Badge>
                    )}
                    {isCurrentPlan && !plan.highlight && (
                      <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800">
                        Current
                      </Badge>
                    )}
                 </div>
                 
                 <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-sm font-medium">{plan.description}</CardDescription>
                 </div>

                 <div className="flex items-baseline text-slate-900 dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">{displayPrice}</span>
                    {plan.key !== "FREE" && <span className="ml-1 text-slate-500 font-medium">/mo</span>}
                 </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    What&apos;s included
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <div className="mt-0.5 p-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 shrink-0">
                             <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        ) : (
                          <X className="w-4 h-4 text-slate-300 dark:text-slate-700 mt-0.5 shrink-0" />
                        )}
                        <span className={cn(
                          feature.included ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"
                        )}>
                          {feature.text}
                          {feature.text.includes("job matches") && (
                             <FeatureGuide description="AI-powered job matching that analyzes your resume against thousands of job posts." className="ml-1.5 align-text-bottom inline-flex h-3.5 w-3.5" />
                          )}
                          {feature.text.includes("Resume AI credits") && (
                             <FeatureGuide description="Credits used to generate highly optimized, tailored resumes for specific job descriptions." className="ml-1.5 align-text-bottom inline-flex h-3.5 w-3.5" />
                          )}
                          {feature.text.includes("Interview AI") && (
                             <FeatureGuide description="AI mock interviews with a realistic 3D avatar and real-time feedback." className="ml-1.5 align-text-bottom inline-flex h-3.5 w-3.5" />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-8">
                 <Button 
                    className={cn(
                      "w-full h-12 text-base font-semibold shadow-sm transition-all duration-200",
                      plan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900/20"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                    onClick={() => onSubscribe(plan)}
                    disabled={loadingKey !== null || isCurrentPlan || (plan.key === "FREE" && user?.plan !== "FREE")}
                 >
                    {loadingKey === plan.key ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.key === "FREE" ? (
                      "Get Started"
                    ) : (
                      "Subscribe Now"
                    )}
                 </Button>
                 {isCurrentPlan && plan.key !== "FREE" && (
                   <Button 
                      variant="link" 
                      className="w-full mt-2 text-slate-400 hover:text-red-500" 
                      size="sm"
                      onClick={onCancelPlan}
                   >
                     Cancel Plan
                   </Button>
                 )}
              </CardFooter>
            </Card>
          )})}
        </div>
      
        {/* Pay As You Go Section */}
        {!showInternational && (
        <div className="space-y-12 pt-10 border-t border-slate-200 dark:border-slate-800">
            
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pay As You Go
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Need extra credits or just want to practice for an interview without a subscription? 
                Top up your account instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Interview AI Pack */}
              <div className="group rounded-3xl p-1 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:to-pink-500/20 transition-all duration-500">
                <div className="h-full bg-white dark:bg-slate-950 rounded-[1.3rem] p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Mic className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
                   </div>
                   
                   <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <Mic className="w-8 h-8" />
                         </div>
                         <div>
                            <div className="flex items-center gap-1.5">
                               <h3 className="text-xl font-bold">Interview Sessions</h3>
                               <FeatureGuide description="Practice for your next role with our interactive AI avatar. Includes voice and video analysis." className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Real-time AI voice & video feedback</p>
                         </div>
                      </div>

                      <div className="grid gap-4">
                         {/* Single Minute - Highlighted as 'Trial' */}
                         <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div>
                               <div className="font-semibold">Quick Practice</div>
                               <div className="text-xs text-slate-500">1 Minute Session</div>
                            </div>
                            <div className="text-right">
                               <div className="font-bold">$1.50</div>
                               <Button variant="ghost" size="sm" className="h-8 text-indigo-600" disabled>Single</Button>
                            </div>
                         </div>

                         {/* Full Session - Featured */}
                         <div className="flex flex-col p-5 rounded-2xl bg-indigo-600 text-white shadow-lg space-y-4">
                            <div className="flex justify-between items-start">
                               <div>
                                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-2">Best Value</Badge>
                                  <div className="font-bold text-lg">Full Mock Interview</div>
                                  <div className="text-indigo-100 text-sm">15 Minutes • Detailed Feedback</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-lg font-bold line-through text-indigo-300">$22.50</div>
                                  <div className="text-3xl font-extrabold">$13.99</div>
                               </div>
                            </div>
                            <Button 
                              className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold"
                              onClick={() => onBuyMinutes(15, 13.99)}
                              disabled={loadingKey !== null}
                            >
                               {loadingKey === "minutes-15" && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                               Get Full Session
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Resume AI Pack */}
              <div className="group rounded-3xl p-1 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 transition-all duration-500">
                <div className="h-full bg-white dark:bg-slate-950 rounded-[1.3rem] p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <FileText className="w-32 h-32 text-emerald-600 dark:text-emerald-400" />
                   </div>

                   <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <FileText className="w-8 h-8" />
                         </div>
                         <div>
                            <div className="flex items-center gap-1.5">
                               <h3 className="text-xl font-bold">Resume Credits</h3>
                               <FeatureGuide description="Buy credits once and use them whenever you need to tailor a resume for a hot job lead." className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tailor resumes for specific jobs</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          {[
                            { credits: 10, price: 5, label: "Starter" },
                            { credits: 20, price: 10, label: "Standard", popular: true },
                            { credits: 30, price: 15, label: "Pro" },
                            { credits: 50, price: 25, label: "Agency" },
                          ].map((pack) => (
                             <button
                                key={pack.credits}
                                onClick={() => onBuyCredits(pack.credits, pack.price)}
                                disabled={loadingKey !== null}
                                className={cn(
                                  "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 relative",
                                  pack.popular 
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-500/50 shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50"
                                )}
                             >
                                {pack.popular && (
                                  <span className="absolute -top-2.5 px-2 py-0.5 bg-emerald-500 text-white text-[10px] uppercase font-bold rounded-full tracking-wide">
                                    Popular
                                  </span>
                                )}
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{pack.credits}</div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{pack.label}</div>
                                <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                   ${pack.price}
                                </div>
                             </button>
                          ))}
                      </div>
                      <p className="text-xs text-center text-slate-400">
                        1 Credit = 1 Tailored Resume Generation
                      </p>
                   </div>
                </div>
              </div>
            </div>
        </div>
        )}

        {showInternational && (
            <div className="py-12 text-center">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm">
                    <Globe className="w-4 h-4" />
                    <span>International usage? Credit purchases coming soon.</span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
}
