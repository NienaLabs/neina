"use client";

import { TRPCProvider } from "@/trpc/client";
import { AuthProvider } from "@/providers/AuthUIProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </TRPCProvider>
  );
}
