/**
 * Centralized plan and top-up definitions shared across the payment router,
 * Moolre integration, webhook fulfillment, and the pricing UI.
 *
 * All prices are in GHS (major unit). Payments are collected via Moolre
 * (mobile money + hosted checkout). There is no recurring billing — a plan
 * purchase grants 30 days of access (tracked via user.planExpiresAt).
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
    priceVal: 0, // GHS
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
    priceVal: 450, // GHS
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
    priceVal: 750, // GHS
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
    priceVal: 1500, // GHS
    description: "For serious job hunters who want maximum advantage.",
  },
} as const;


export type PlanKey = keyof typeof PLANS;

/**
 * Pay-As-You-Go resume credit packs.
 * Prices are authoritative here — the client only sends the pack key and the
 * server derives the charge amount, so amounts can never be tampered with.
 */
export const CREDIT_PACKS = {
  CREDITS_10: { credits: 10, priceGHS: 25, label: "Starter" },
  CREDITS_20: { credits: 20, priceGHS: 45, label: "Standard" },
  CREDITS_30: { credits: 30, priceGHS: 65, label: "Pro" },
  CREDITS_50: { credits: 50, priceGHS: 100, label: "Agency" },
} as const;

export type CreditPackKey = keyof typeof CREDIT_PACKS;

/** Pay-As-You-Go interview minute packs. */
export const MINUTE_PACKS = {
  MINUTES_15: { minutes: 15, priceGHS: 130, label: "Full Mock Interview" },
} as const;

export type MinutePackKey = keyof typeof MINUTE_PACKS;
