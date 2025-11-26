import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
import { CVIProvider } from "@/components/cvi/components/cvi-provider";
import { AuthProvider } from "@/providers/AuthUIProvider";
import {Toaster} from 'sonner'
import {ThemeProvider} from 'next-themes'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job AI",
  description: "Land your dream job with AI tools",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
        {/*<Header/>*/}
        {children}
         <Toaster/>
        </ThemeProvider>
      </body>
    </html>     
      </AuthProvider>
    </TRPCProvider>
  );
}
