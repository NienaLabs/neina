'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/**
 * Personal information interface for cover letter header
 */
export interface CoverLetterPersonalInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

/**
 * CoverLetterPreview component props interface
 */
export interface CoverLetterPreviewProps {
  /** Cover letter content */
  content: string;
  /** Personal info for header */
  personalInfo?: CoverLetterPersonalInfo;
  /** Page size for styling */
  pageSize?: 'A4' | 'LETTER';
  /** Additional class names */
  className?: string;
}

/**
 * Cover letter preview component with professional letter format
 * Adapted from temp-research-repo cover-letter-preview.tsx
 */
export function CoverLetterPreview({
  content,
  personalInfo,
  pageSize = 'A4',
  className,
}: CoverLetterPreviewProps) {
  // Get current date
  const today = format(new Date(), 'MMMM d, yyyy');

  // Parse content into paragraphs
  const safeContent = content || '';
  const paragraphs = safeContent.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <div
      className={cn(
        'bg-white shadow-xl',
        className
      )}
      style={{
        width: '210mm',
        height: '297mm',
        padding: '20mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Letter Content */}
      <div className="h-full flex flex-col font-serif text-black leading-relaxed">
        {/* Header - Personal Info */}
        {personalInfo && (
          <header className="mb-8 border-b-2 border-black pb-4 shrink-0">
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              {personalInfo.name || 'Your Name'}
            </h1>
            <div className="mt-2 font-mono text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
            </div>
          </header>
        )}

        {/* Date */}
        <div className="mb-8 shrink-0">
          <p className="font-mono text-sm text-gray-600">{today}</p>
        </div>

        {/* Body */}
        <div className="space-y-4 flex-1 overflow-hidden">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, idx) => (
              <p key={idx} className="font-serif text-base leading-relaxed text-gray-800">
                {para}
              </p>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="font-mono text-sm">No cover letter content yet</p>
              <p className="font-mono text-xs mt-2">
                Click &quot;Generate&quot; or start writing in the editor
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
