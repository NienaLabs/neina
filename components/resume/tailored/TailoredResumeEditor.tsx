"use client";

import React from "react";
import ResumeEditor from "@/components/resume/editor";
import { KeywordInsights } from "./KeywordInsights";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TailoredResumeEditorProps {
  resumeId: string;
  initialData: any; // ResumeExtraction
  analysisData: {
    matches: string[];
    missing: string[];
  };
  score: number;
  jobDescription: string;
  name: string;
  role: string;
}

export function TailoredResumeEditor({
  resumeId,
  initialData,
  analysisData,
  score,
  jobDescription,
  name,
  role
}: TailoredResumeEditorProps) {

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      
      {/* Premium Header */}
      <header className="h-16 shrink-0 border-b flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-4">
           <Link href="/resume" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
           </Link>
           <div className="flex flex-col">
              <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg leading-none">{name}</h1>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/20 text-primary bg-primary/5">
                    Tailored
                  </Badge>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">{role}</span>
           </div>
        </div>

        <div className="flex items-center gap-2">
            <Link href={`/resume/preview/${resumeId}`}>
                <Button variant="default" size="sm" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all">
                    <Download className="w-4 h-4" />
                    Export PDF
                </Button>
            </Link>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Resume Editor */}
          <div className="flex-1 overflow-y-auto bg-muted/10 relative scrollbar-none">
             <div className="max-w-4xl mx-auto min-h-full pb-20">
                <ResumeEditor 
                    fixes={{}} // Auto-fixes might be less relevant or handled differently here
                    extractedData={initialData} 
                    resumeId={resumeId} 
                    isTailored={true} 
                />
             </div>
          </div>

          {/* Right Panel: AI Insights & Job Context */}
          <div className="w-[350px] xl:w-[400px] shrink-0 h-full hidden lg:block border-l shadow-xl shadow-black/5 z-20">
              <KeywordInsights 
                jobDescription={jobDescription}
                matchedKeywords={analysisData.matches}
                missingKeywords={analysisData.missing}
                score={score}
              />
          </div>

      </div>
    </div>
  );
}
