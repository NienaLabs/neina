import { redirect } from "next/navigation";
import LandingPage from "../components/landing/LandingPageClient";
import { auth } from "@/lib/auth"; // or your server auth call
import { headers } from 'next/headers'
export default async function Page() {
//const session = await auth.api.getSession({ headers: await headers() });

 // if (session) redirect("/dashboard");
  return <LandingPage/>;
}
