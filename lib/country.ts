import { headers } from "next/headers";

/**
 * ISO 3166-1 alpha-2 codes for African countries.
 * Used to determine whether to show GHS/Paystack pricing or USD/Polar pricing.
 */
export const AFRICAN_COUNTRIES = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG",
  "CD", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW",
  "CI", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ",
  "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
  "TZ", "TG", "TN", "UG", "ZM", "ZW",
];

/**
 * Resolves the country code for the current request.
 *
 * Detection strategy (in order):
 *  1. `x-vercel-ip-country` header — provided by Vercel's edge network for free.
 *     This is instant and does not incur any external API call.
 *  2. IP-based geolocation fallback via ip-api.com (free, 45 req/min limit).
 *     Used when running locally or on non-Vercel infrastructure.
 *     Reads the client IP from `x-forwarded-for` header.
 *  3. Default to "GH" (Ghana) when all else fails (local dev with localhost IP).
 *
 * Note: No native browser API can reliably detect country — that must always
 * happen server-side using the IP address. The browser's Geolocation API only
 * provides lat/lng, requires user permission, and can't be used in SSR.
 */
export async function getCountryCode(): Promise<string> {
  const headersList = await headers();

  // 1. Vercel edge geo header — most reliable in production
  const vercelCountry = headersList.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry;

  // 2. IP-based fallback for local dev / non-Vercel deployments
  const forwardedFor = headersList.get("x-forwarded-for");
  const rawIp = forwardedFor?.split(",")[0].trim();
  const isLocalIp =
    !rawIp ||
    rawIp === "::1" ||
    rawIp === "127.0.0.1" ||
    rawIp.startsWith("192.168.") ||
    rawIp.startsWith("10.");

  if (!isLocalIp && rawIp) {
    try {
      // ip-api.com is free up to 45 req/min. No API key required.
      // Next.js fetch cache deduplicates identical requests within a render.
      const res = await fetch(
        `https://ip-api.com/json/${rawIp}?fields=countryCode`,
        {
          // Cache for 24 hours — country rarely changes between requests from same IP
          next: { revalidate: 86400 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.countryCode && data.countryCode !== "") {
          return data.countryCode as string;
        }
      }
    } catch (err) {
      // Non-fatal — fall through to default
      console.warn("[country] IP geolocation fallback failed:", err);
    }
  }

  // 3. Default for local development
  return "GH";
}

/**
 * Returns true if the current request originates from an African country.
 * African users are shown GHS (Ghana Cedis) pricing with Paystack as the provider.
 */
export async function isAfricanUser(): Promise<boolean> {
  const country = await getCountryCode();
  return AFRICAN_COUNTRIES.includes(country);
}
