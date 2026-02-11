'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CoverLetterEditor component props interface
 */
export interface CoverLetterEditorProps {
  /** Cover letter content */
  content: string;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when save is triggered */
  onSave: () => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Cover letter editor component with textarea and word/character count
 * Adapted from temp-research-repo cover-letter-editor.tsx
 */
export function CoverLetterEditor({
  content,
  onChange,
  onSave,
  isSaving,
  className,
}: CoverLetterEditorProps) {
  // Calculate word and character counts
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = content.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-[#F5F5F0]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
            Cover Letter
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-500">
            {wordCount} words · {charCount} chars
          </span>
          <Button size="sm" onClick={onSave} disabled={isSaving} className="h-8 text-xs">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your cover letter here..."
          className={cn(
            'w-full h-full min-h-[400px] p-4',
            'font-mono text-sm leading-relaxed',
            'border-2 border-black bg-white',
            'resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2',
            'placeholder:text-gray-400'
          )}
        />
      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-gray-200 bg-[#F5F5F0]">
        <p className="font-mono text-xs text-gray-500">
          Tip: Personalize your cover letter for the specific job and company
        </p>
      </div>
    </div>
  );
}
