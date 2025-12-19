import { headers } from "next/headers";

// List of African country codes (ISO 3166-1 alpha-2)
export const AFRICAN_COUNTRIES = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", 
  "CD", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", 
  "CI", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", 
  "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", 
  "TZ", "TG", "TN", "UG", "ZM", "ZW"
];

export async function getCountryCode(): Promise<string> {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country");
  
  // Return country or default to 'GH' (Ghana) for testing as requested
  // In production outside Vercel, this will also fall back to GH unless configured otherwise
  return country || "GH";
}

export async function isAfricanUser(): Promise<boolean> {
  const country = await getCountryCode();
  return AFRICAN_COUNTRIES.includes(country);
}
