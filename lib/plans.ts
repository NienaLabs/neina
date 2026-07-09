/**
 * Centralized plan definitions shared across tRPC routers, Polar integration,
 * Paystack integration, and the pricing UI.
 */

export const PLANS = {
  FREE: {
    key: "FREE",
    name: "Free",
    price: 0,
    features: ["1 resume upload", "Unlimited Job Recommendations", "3 Resume AI credits (one-time)"],
    credits: 3,
    minutes: 0,
    matches: 10,
    priceVal: 0,       // GHS (pesewas for Paystack: multiply by 100)
    priceValUSD: 0,    // USD cents
    description: "Perfect for new users exploring the platform.",
  },
  SILVER: {
    key: "SILVER",
    name: "Silver",
    price: 450,
    features: ["30 job matches/week", "10 Resume AI credits/month"],
    credits: 10,
    minutes: 0,
    matches: 30,
    priceVal: 450,      // GHS
    priceValUSD: 2900,  // USD cents ($29)
    description: "Affordable for early job seekers.",
  },
  GOLD: {
    key: "GOLD",
    name: "Gold",
    price: 750,
    features: ["60 job matches/week", "20 Resume AI credits/month", "15 interview mins/month"],
    credits: 20,
    minutes: 15,
    matches: 60,
    priceVal: 750,      // GHS
    priceValUSD: 4900,  // USD cents ($49)
    description: "Best for active job seekers.",
  },
  DIAMOND: {
    key: "DIAMOND",
    name: "Diamond",
    price: 1500,
    features: ["Unlimited matches", "30 Resume AI credits/month", "60 interview mins/month"],
    credits: 30,
    minutes: 60,
    matches: 1000,
    priceVal: 1500,     // GHS
    priceValUSD: 9900,  // USD cents ($99)
    description: "For serious job hunters who want maximum advantage.",
  },
} as const;



/**
 * Paystack Plan codes — created in the Paystack dashboard with a monthly interval.
 * Stored in environment variables so they can differ between sandbox and production.
 *
 * To create plans in Paystack dashboard:
 *   Plans → Create Plan → set amount (in kobo for NGN or pesewas for GHS), interval = monthly
 *
 * Copy the `plan_code` value (e.g. "PLN_xxxxxxxxxx") into your .env file.
 */
export const PAYSTACK_PLAN_CODES = {
  SILVER:  process.env.PAYSTACK_PLAN_CODE_SILVER!,
  GOLD:    process.env.PAYSTACK_PLAN_CODE_GOLD!,
  DIAMOND: process.env.PAYSTACK_PLAN_CODE_DIAMOND!,
} as const;

export type PlanKey = keyof typeof PLANS;
