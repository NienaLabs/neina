import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
import { AuthProvider } from "@/providers/AuthUIProvider";
import { Toaster } from 'sonner'
import { SuspensionGuard } from "@/components/auth/SuspensionGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Niena",
  description: "Achieve your career goals with AI-powered tools",
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
              {/*<Header/>*/}
              <SuspensionGuard>
                {children}
              </SuspensionGuard>
              <Toaster />
          </body>
        </html>
      </AuthProvider>
    </TRPCProvider>
  );
}
