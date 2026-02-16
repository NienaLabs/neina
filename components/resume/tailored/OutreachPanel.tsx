'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Wand2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface OutreachPanelProps {
  content: string;
  onChange: (content: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  className?: string;
}

/**
 * OutreachPanel - Displays and edits AI-generated outreach messages
 * for recruiters or hiring managers.
 */
export function OutreachPanel({
  content,
  onChange,
  onGenerate,
  isGenerating,
  className,
}: OutreachPanelProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const charCount = content.length;

  /**
   * Copies the outreach message content to clipboard.
   */
  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-sm tracking-tight text-gray-900">
            Outreach Message
          </h2>
          {content && (
            <span className="text-[10px] text-gray-400 font-mono ml-1">
              {charCount} chars
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {content && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopy} 
              disabled={isGenerating}
              className="h-7 text-xs gap-1.5"
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={onGenerate} 
            disabled={isGenerating} 
            className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            {isGenerating ? 'Generating...' : content ? 'Regenerate' : 'Generate Draft'}
          </Button>
        </div>
      </div>

      {/* Editor / Empty State */}
      {content || isGenerating ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your outreach message will appear here..."
          className={cn(
            'w-full min-h-[300px] p-4 rounded-lg border border-gray-200',
            'font-sans text-sm leading-relaxed text-gray-800',
            'resize-y bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300',
            'placeholder:text-gray-400'
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400 py-16 text-center rounded-lg border border-dashed border-gray-200 bg-gray-50/30">
            <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm max-w-xs mb-4">
                Generate a personalized outreach message to recruiters or hiring managers based on this job description.
            </p>
            <Button variant="outline" size="sm" onClick={onGenerate}>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Draft
            </Button>
        </div>
      )}

      {/* Tip */}
      {content && (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          Customize placeholder values (e.g., [Hiring Manager Name]) before sending.
        </p>
      )}
    </div>
  );
}
