export const PLANS = {
  FREE: {
    key: "FREE",
    name: "Free",
    price: 0,
    features: ["1 resume upload", "Unlimited Job Recommendations", "3 Resume AI credits (one-time)"],
    credits: 3,
    minutes: 0,
    matches: 10,
    priceVal: 0,
    description: "Perfect for new users exploring the platform.",
  },
  SILVER: {
    key: "SILVER",
    name: "Silver",
    price: 450, // GHS
    features: ["30 job matches/week", "10 Resume AI credits/month"],
    credits: 10,
    minutes: 0,
    matches: 30,
    priceVal: 450,
    description: "Affordable for early job seekers.",
  },
  GOLD: {
    key: "GOLD",
    name: "Gold",
    price: 750, // GHS
    features: ["60 job matches/week", "20 Resume AI credits/month", "15 interview mins/month"],
    credits: 20,
    minutes: 15,
    matches: 60,
    priceVal: 750,
    description: "Best for active job seekers.",
  },
  DIAMOND: {
    key: "DIAMOND",
    name: "Diamond",
    price: 1500, // GHS
    features: ["Unlimited matches", "30 Resume AI credits/month", "60 interview mins/month"],
    credits: 30,
    minutes: 60,
    matches: 1000,
    priceVal: 1500,
    description: "For serious job hunters who want maximum advantage.",
  },
} as const;

export const POLAR_PRODUCT_IDS = {
  SILVER: "f30a8e41-4d9a-423a-9638-4ddbc0c22a27",
  GOLD: "cb97ea94-750b-4904-b23f-c4379bb194b5",
  DIAMOND: "d9b65b5f-9d18-4c4f-add6-02aa3aaf3804",
} as const;

export type PlanKey = keyof typeof PLANS;
