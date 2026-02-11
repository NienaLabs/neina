'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Target, RefreshCw, PlusCircle, CheckCircle } from 'lucide-react';
import { FeatureGuide } from '@/components/FeatureGuide';

export interface JobDescriptionPanelProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  selectedPrompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: (mode?: string) => void;
  isGenerating: boolean;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

const TAILORING_OPTIONS = [
  {
    id: 'nudge',
    label: 'Nudge',
    description: 'Update with small adjustments to better align with the role.',
    icon: Sparkles
  },
  {
    id: 'keywords',
    label: 'Keywords',
    description: 'Update to optimize for ATS keywords found in the job description.',
    icon: Target
  },
  {
    id: 'full',
    label: 'Full Tailor',
    description: 'Regenerate sections to fully target this specific role.',
    icon: RefreshCw
  },
];

const ADVANCED_ACTIONS = [
    {
        id: 'enrich',
        label: 'Enrich',
        description: 'Regenerate with more detail and impact.',
        icon: PlusCircle
    },
    {
        id: 'refine',
        label: 'Refine',
        description: 'Regenerate to polish the language and remove buzzwords.',
        icon: CheckCircle
    }
];

export const JobDescriptionPanel: React.FC<JobDescriptionPanelProps> = ({
  jobDescription,
  onJobDescriptionChange,
  selectedPrompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  matchedKeywords = [],
  missingKeywords = [],
}) => {
  const hasKeywords = matchedKeywords.length > 0 || missingKeywords.length > 0;
  const hasJobDescription = jobDescription.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Job Description Input Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
            <label className="block text-sm font-mono font-bold uppercase tracking-wider text-black">
                Job Description
            </label>
            <FeatureGuide 
                title="Why do I need this?"
                description="Paste the job description of the role you're applying for. Our AI analyzes it to identify keywords and tailor your resume content to match requirements."
                className="w-4 h-4 text-gray-400 hover:text-blue-600"
            />
        </div>
        <div className="relative">
            <Textarea
                placeholder="Paste the job description here to analyze and tailor..."
                className="font-mono text-sm bg-white border-2 border-black focus:ring-0 focus:border-blue-600 resize-none p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] max-h-[200px]"
                value={jobDescription}
                onChange={(e) => onJobDescriptionChange(e.target.value)}
                disabled={isGenerating}
                rows={8}
            />
             <div className="absolute bottom-2 right-2 text-xs font-mono text-gray-400 pointer-events-none bg-white/80 px-1">
                {jobDescription.length} chars
            </div>
        </div>
      </div>

      {/* Keywords Analysis Section (Visible if keywords exist) */}
      {hasKeywords && hasJobDescription && (
        <div className="space-y-4 border-2 border-black p-4 bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <Target className="w-5 h-5" />
                <h3 className="font-mono font-bold uppercase text-sm">Keyword Analysis</h3>
            </div>
            
            <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-gray-500">Found in Resume</div>
                <div className="flex flex-wrap gap-2">
                    {matchedKeywords.map((k) => (
                        <span key={k} className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 text-xs font-bold font-mono">
                            {k}
                        </span>
                    ))}
                    {matchedKeywords.length === 0 && <span className="text-xs text-gray-400 italic">None found yet</span>}
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-gray-500">Missing from Resume</div>
                <div className="flex flex-wrap gap-2">
                    {missingKeywords.map((k) => (
                        <span key={k} className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-mono">
                            {k}
                        </span>
                    ))}
                     {missingKeywords.length === 0 && <span className="text-xs text-gray-400 italic">Great job! No major keywords missing.</span>}
                </div>
            </div>
        </div>
      )}

      {/* Tailoring Actions */}
      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <label className="block text-sm font-mono font-bold uppercase tracking-wider text-black">
                Tailoring Actions
            </label>
             <FeatureGuide 
                title="How Tailoring Works"
                description="Choose a mode to optimize your resume. 'Keywords' adds missing terms. 'Nudge' makes small adjustments. 'Full Tailor' rewrites sections for maximum impact."
                className="w-4 h-4 text-gray-400 hover:text-blue-600"
            />
        </div>
        <div className="grid grid-cols-1 gap-3">
            {TAILORING_OPTIONS.map((option) => (
                 <Button
                    key={option.id}
                    variant="outline"
                    className={`h-auto py-4 px-4 justify-start border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white hover:bg-blue-50 group flex flex-col items-start gap-1 ${selectedPrompt === option.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    onClick={() => {
                        onPromptChange(option.id);
                        onGenerate(option.id);
                    }}
                    disabled={isGenerating || !hasJobDescription}
                >   
                    <div className="flex items-center gap-2 w-full flex-shrink-0">
                        <option.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-bold font-mono uppercase text-sm">{option.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-sans text-left pl-6 pr-2 block whitespace-normal break-words overflow-wrap-anywhere">{option.description}</span>
                </Button>
            ))}
        </div>
      </div>

       {/* Advanced Actions */}
       <div className="space-y-4">
         <label className="block text-sm font-mono font-bold uppercase tracking-wider text-black">
            Advanced Improvements
        </label>
        <div className="grid grid-cols-2 gap-3">
            {ADVANCED_ACTIONS.map((action) => (
                 <Button
                    key={action.id}
                    variant="outline"
                    className="h-auto py-3 px-3 justify-start border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white hover:bg-purple-50 group flex flex-col items-start gap-1"
                    onClick={() => onGenerate(action.id)}
                    disabled={isGenerating || !hasJobDescription}
                >   
                    <div className="flex items-center gap-2 w-full flex-shrink-0">
                        <action.icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="font-bold font-mono uppercase text-xs">{action.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans text-left pl-6 pr-1 block leading-tight whitespace-normal break-words overflow-wrap-anywhere">{action.description}</span>
                </Button>
            ))}
        </div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                 <p className="font-mono font-bold text-lg blinking-cursor">PROCESSING RESUME...</p>
            </div>
        </div>
      )}

    </div>
  );
};
