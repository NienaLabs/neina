import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
import { AuthProvider } from "@/providers/AuthUIProvider";
import { Toaster } from 'sonner'
import { SuspensionGuard } from "@/components/auth/SuspensionGuard";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";
import { CookiePrompt } from "@/components/shared/CookiePrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://app.nienalabs.com'),
  title: {
    default: "Niena - Achieve Career Goals with AI-powered Tools",
    template: "%s | Niena"
  },
  description: "Achieve your career goals with AI-powered tools like AI Resume Builder, Interview Coach, and Smart Job Matcher.",
  keywords: ["niena", "interview ai", "resume ai", "matcher", "jobs", "career", "ai job search", "interview coach"],
  authors: [{ name: "Niena Labs" }],
  creator: "Niena Labs",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.nienalabs.com",
    title: "Niena - Achieve Career Goals with AI-powered Tools",
    description: "Achieve your career goals with AI-powered tools like AI Resume Builder, Interview Coach, and Smart Job Matcher.",
    siteName: "Niena",
    images: [
      {
        url: "/logo.png", // Needs to be added or ensure it exists
        width: 1200,
        height: 630,
        alt: "Niena - AI Career Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Niena - Achieve Career Goals with AI-powered Tools",
    description: "Achieve your career goals with AI-powered tools like AI Resume Builder, Interview Coach, and Smart Job Matcher.",
    creator: "@nienalabs", // Assuming handle or placeholder
    images: ["/logo.png"],
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
  return (
    <TRPCProvider>
      <AuthProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} font-syne antialiased`}
          >
            <NotificationBanner />
            <CookiePrompt />
            {/*<Header/>*/}
            <SuspensionGuard>
              {children}
            </SuspensionGuard>
            <ServiceWorkerRegister />
            <Toaster />
          </body>
        </html>
      </AuthProvider>
    </TRPCProvider>
  );
}
