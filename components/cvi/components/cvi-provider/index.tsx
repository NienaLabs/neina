'use client';

import React, { createContext, useContext } from "react";
import { DailyProvider, useDaily } from "@daily-co/daily-react";
import type { DailyCall } from "@daily-co/daily-js";
// Create context to expose daily call object
const DailyContext = createContext<DailyCall | null>(null);

export const useDailyCall = () => {
  const context = useContext(DailyContext);
  if (context === null) {
    throw new Error('useDailyCall must be used within CVIProvider');
  }
  return context;
};

// Wrapper component to provide daily call object
const DailyCallProvider = ({ children }: { children: React.ReactNode }) => {
  const daily = useDaily();
  return (
    <DailyContext.Provider value={daily}>
      {children}
    </DailyContext.Provider>
  );
};

interface CVIProviderProps {
  children: React.ReactNode;
  meetingUrl?: string; // Made optional
}

export const CVIProvider = ({ children, meetingUrl }: CVIProviderProps) => {
  // If no meeting URL is provided, just render children without DailyProvider
  if (!meetingUrl) {
    console.warn('CVIProvider: meetingUrl is not provided - video functionality will be disabled');
    return <>{children}</>;
  }

  return (
    <DailyProvider url={meetingUrl}>
      <DailyCallProvider>{children}</DailyCallProvider>
    </DailyProvider>
  );
};
