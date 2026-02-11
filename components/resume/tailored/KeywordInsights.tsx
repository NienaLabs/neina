"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Search, ChevronDown, ChevronUp, Copy, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface KeywordInsightsProps {
  jobDescription: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  score: number;
}

export function KeywordInsights({
  jobDescription,
  matchedKeywords = [],
  missingKeywords = [],
  score,
}: KeywordInsightsProps) {
  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/50">
      {/* Header */}
      <div className="p-4 border-b bg-muted/20">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          AI Job Insights
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Optimize your resume for this specific job description.
        </p>
      </div>

      {/* Score Card */}
      <div className="p-6 bg-linear-to-b from-background to-muted/30 border-b">
         <div className="flex items-end justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Word Match</span>
            <span className={cn(
                "text-2xl font-black",
                score >= 80 ? "text-green-500" : score >= 50 ? "text-orange-500" : "text-red-500"
            )}>
                {Math.round(score * 100)}%
            </span>
         </div>
         <Progress 
           value={score * 100} 
           className="h-2" 
           indicatorClassName={cn(
             score >= 0.8 ? "bg-green-500" : 
             score >= 0.5 ? "bg-orange-500" : "bg-red-500"
           )}
         />
         <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500/20 items-center justify-center flex">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                </div>
                <span className="font-medium text-foreground">{matchedKeywords.length} Found</span>
            </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/20 items-center justify-center flex">
                     <div className="w-1 h-1 rounded-full bg-red-500" />
                </div>
                <span className="font-medium text-foreground">{missingKeywords.length} Missing</span>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4">
             <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="analysis">Gap Analysis</TabsTrigger>
                <TabsTrigger value="job">Job Description</TabsTrigger>
            </TabsList>
        </div>

        {/* GAP ANALYSIS */}
        <TabsContent value="analysis" className="flex-1 overflow-hidden p-0 mt-0">
             <ScrollArea className="h-full">
                 <div className="p-4 space-y-6">
                    
                    {/* Missing Keywords (Priority) */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            Missing Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {missingKeywords.length > 0 ? (
                                missingKeywords.map((k) => (
                                    <Badge 
                                        key={k} 
                                        variant="outline" 
                                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors cursor-help"
                                        title="Add this keyword contextually to your resume"
                                    >
                                        {k}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No missing keywords found! Great job.</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Matched Keywords */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Matched Keywords
                        </h3>
                         <div className="flex flex-wrap gap-2">
                            {matchedKeywords.length > 0 ? (
                                matchedKeywords.map((k) => (
                                    <Badge 
                                        key={k} 
                                        variant="outline" 
                                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors"
                                    >
                                        {k}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Start adding keywords to match the job.</p>
                            )}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">💡 Pro Tip</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                            Don't just list keywords. Weave them into your "Experience" bullets to show <i>how</i> you used them. For example, instead of just "Python", write "Built data pipelines using <b>Python</b>...".
                        </p>
                    </div>

                 </div>
             </ScrollArea>
        </TabsContent>

        {/* JOB DESCRIPTION */}
        <TabsContent value="job" className="flex-1 overflow-hidden p-0 mt-0">
             <ScrollArea className="h-full">
                <div className="p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">
                            {jobDescription}
                        </p>
                    </div>
                </div>
             </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
