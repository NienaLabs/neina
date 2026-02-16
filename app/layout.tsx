import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
import { AuthProvider } from "@/providers/AuthUIProvider";
import { Toaster } from 'sonner'
import { SuspensionGuard } from "@/components/auth/SuspensionGuard";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";
import { CookiePrompt } from "@/components/shared/CookiePrompt";
import { NotificationSSEProvider } from "@/components/notifications/NotificationSSEProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://app.nienalabs.com'),
  title: {
    default: "Niena – AI Resume Optimization, Job Matching & Interview Prep",
    template: "%s | Niena"
  },
  description: "Achieve your career goals with Niena Labs' AI-powered tools: AI Resume Optimization, Smart Job Matching with Job recommendations, and Real-time AI Interview Prep with our AI avatar or voice AI.",
  keywords: ["niena", "niena labs", "ai resume", "job matching", "interview prep", "career ai", "resume optimization"],
  authors: [{ name: "Niena Labs" }],
  creator: "Niena Labs",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.nienalabs.com",
    title: "Niena – AI Resume Optimization, Job Matching & Interview Prep",
    description: "Achieve your career goals with Niena Labs' AI-powered tools: AI Resume Optimization, Smart Job Matching with Job recommendations, and Real-time AI Interview Prep with our AI avatar or voice AI.",
    siteName: "Niena",
    images: [
      {
        url: "/og-image.png", // Add a proper 1200x630 OG image
        width: 1200,
        height: 630,
        alt: "Niena - AI Career Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Niena – AI Resume Optimization, Job Matching & AI Interview Prep",
    description: "Achieve your career goals with Niena Labs' AI-powered tools: AI Resume Optimization, Smart Job Matching with Job recommendations, and Real-time AI Interview Prep with our AI avatar or voice AI.",
    creator: "@LabsNiena86233", // Assuming handle or placeholder
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'f9bOaCQcJ0fcSc5XIzbaiVRutwYfyg-4pKVZ-VnO27s',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Niena Labs",
    "url": "https://app.nienalabs.com",
    "logo": "https://app.nienalabs.com/icon.png",
    "description": "AI Resume Optimization, Job Matching & Interview Prep by Niena Labs.",
    "sameAs": [
      "https://twitter.com/LabsNiena86233",
      "https://linkedin.com/company/niena-labs"
    ]
  };

  return (
    <TRPCProvider>
      <AuthProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
          >
            <NotificationSSEProvider>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
              <NotificationBanner />
              <CookiePrompt />
              {/*<Header/>*/}
              <SuspensionGuard>
                {children}
              </SuspensionGuard>
              <ServiceWorkerRegister />
              <Toaster position="top-right" />
            </NotificationSSEProvider>
          </body>
        </html>
      </AuthProvider>
    </TRPCProvider>
  );
}
