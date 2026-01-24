import { redirect } from "next/navigation";
import LandingPage from "../components/landing/LandingPageClient";
import { auth } from "@/lib/auth"; // or your server auth call
import { headers, cookies } from 'next/headers'
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Niena - AI Resume Builder & Interview Coach",
  description: "Land your dream job with Niena. AI-powered resume builder, interview practice with real-time feedback, and smart job matching tailored to your profile.",
  alternates: {
    canonical: 'https://app.nienalabs.com',
  },
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const cookieStore = await cookies();
  const cookieConsent = cookieStore.get('niena-cookie-consent')?.value;

  // Only auto-redirect if session exists AND they have explicitly accepted cookies
  if (session && cookieConsent === 'true') redirect("/dashboard");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "name": "Niena",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "description": "AI-powered career platform offering resume building, interview coaching, and job matching tools."
              },
              {
                "@type": "Organization",
                "name": "Niena Labs",
                "url": "https://app.nienalabs.com",
                "logo": "https://app.nienalabs.com/logo.png",
                "sameAs": [
                  "https://twitter.com/nienalabs"
                ]
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How does the AI Resume Builder work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Our AI analyzes your experience and skills to generate a professional, ATS-friendly resume tailored to your target job."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is the Interview Coach real-time?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, you practice with an AI avatar in real-time that simulates a real interviewer and provides instant feedback on your performance."
                    }
                  }
                ]
              }
            ]
          })
        }}
      />
      <LandingPage />
    </>
  );
}
