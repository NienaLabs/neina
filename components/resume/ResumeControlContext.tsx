"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface ResumeControlContextType {
  isProcessing: boolean
  setIsProcessing: (loading: boolean) => void
}

const ResumeControlContext = createContext<ResumeControlContextType | undefined>(undefined)

export function ResumeControlProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <ResumeControlContext.Provider value={{ isProcessing, setIsProcessing }}>
      {children}
    </ResumeControlContext.Provider>
  )
}

export function useResumeControl() {
  const context = useContext(ResumeControlContext)
  if (!context) {
    throw new Error("useResumeControl must be used within a ResumeControlProvider")
  }
  return context
}
