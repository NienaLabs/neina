'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

/**
 * GeneratePromptPanel component props interface
 */
export interface GeneratePromptPanelProps {
  /** Callback when generate button is clicked */
  onGenerate: () => void;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Prompt panel shown when cover letter is empty
 * Encourages user to generate AI cover letter
 */
export function GeneratePromptPanel({
  onGenerate,
  isGenerating,
  className,
}: GeneratePromptPanelProps) {
  return (
    <div className={className}>
      <div className="border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_#000000]">
        <div className="text-center space-y-6">
          <div>
            <h3 className="font-mono text-lg font-bold uppercase mb-2">
              Generate Cover Letter
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Let AI create a professional cover letter tailored to this job description,
              highlighting your relevant experience and skills from your resume.
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              size="lg"
              className="h-12 px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
            <p className="font-mono text-xs text-yellow-800">
              <strong>Tip:</strong> Make sure you have provided a job description to get
              the best results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
