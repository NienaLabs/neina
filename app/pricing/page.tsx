import { getCountryCode, isAfricanUser } from "@/lib/country";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const country = await getCountryCode();
  const isAfrican = await isAfricanUser();

  return (
    <PricingClient userCountry={country} isAfricanUser={isAfrican} />
  );
}
