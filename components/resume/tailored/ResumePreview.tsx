'use client';

import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { ResumeData, TemplateType } from '@/lib/types/resume';
import { HighlightedResumeView } from './HighlightedResumeView';
import { CoverLetterPreview } from './CoverLetterPreview';
import { generateClassicSingleItems, ClassicSingleRenderer } from './templates/ClassicSingle';
import { generateModernSingleItems, ModernSingleRenderer } from './templates/ModernSingle';
import { generateClassicTwoColumnItems, ClassicTwoColumnRenderer, ClassicTwoColumnSidebar } from './templates/ClassicTwoColumn';
import { generateModernTwoColumnItems, ModernTwoColumnRenderer, ModernTwoColumnSidebar } from './templates/ModernTwoColumn';

// import { cn } from '@/lib/utils'; 

// Constants for A4 size in pixels (approx 96 DPI)
// A4 is 210mm x 297mm. 
const MM_TO_PX = 3.7795275591; 
const A4_HEIGHT_MM = 297;
const PADDING_MM = 0; // Padding is now handled by templates or page layout

// Height of the writable area
const PADDING_V_MM = 40; // 20mm top + 20mm bottom safe default
const CONTENT_HEIGHT_PX = Math.floor((A4_HEIGHT_MM - PADDING_V_MM) * MM_TO_PX);
const PAGE_BUFFER_PX = 20; // Extra breathing room
interface ResumePreviewProps {
  data: ResumeData | null;
  activeTab: 'resume' | 'cover-letter' | 'jd-match';
  template?: TemplateType;
  jobDescription?: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  totalKeywords?: number;
  wordMatchScore?: number;
  scale?: number;
  isPrinting?: boolean;
  coverLetter?: string;
}

const ResumeItemRenderer: React.FC<{ item: any; template: TemplateType; accentColor?: string }> = ({ item, template, accentColor }) => {
    switch (template) {
        case 'modern-single':
            return <ModernSingleRenderer item={item} accentColor={accentColor} />;
        case 'classic-two':
            return <ClassicTwoColumnRenderer item={item} accentColor={accentColor} />;
        case 'modern-two':
            return <ModernTwoColumnRenderer item={item} accentColor={accentColor} />;
        case 'classic-single':
        default:
            return <ClassicSingleRenderer item={item} accentColor={accentColor} />;
    }
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(({ 
    data, 
    activeTab,
    template = 'classic-single',
    matchedKeywords = [],
// ...
    missingKeywords = [],
    wordMatchScore = 0,
    scale = 1,
    isPrinting = false,
    coverLetter = ''
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<ResumePreviewItem[][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isComputing, setIsComputing] = useState(true);

  // 1. Prepare Flattened List of Items
  const items = useMemo(() => {
    if (!data) return [];
    
    switch (template) {
        case 'classic-single':
            return generateClassicSingleItems(data);
        case 'modern-single':
            return generateModernSingleItems(data);
        case 'classic-two':
            return generateClassicTwoColumnItems(data);
        case 'modern-two':
            return generateModernTwoColumnItems(data);
        default:
            return generateClassicSingleItems(data);
    }
  }, [data, template]);

  // 2. Measure and Pagination Logic (Runs for both Screen and Print modes)
  useLayoutEffect(() => {
     if (activeTab !== 'resume' && !isPrinting) return;
     const container = containerRef.current;
     if (!container) return;

     const children = Array.from(container.children) as HTMLElement[];
     
     const newPages: ResumePreviewItem[][] = [];
     let currentPage: ResumePreviewItem[] = [];
     let currentHeight = 0;
     
     // Buffer to prevent content touching the exact edge
     const PAGE_BUFFER_PX = 20; 

     items.forEach((item, index) => {
         const child = children[index];
         if (!child) return;

         const height = child.offsetHeight;
         
         if (currentHeight + height > (CONTENT_HEIGHT_PX - PAGE_BUFFER_PX) && currentPage.length > 0) {
             newPages.push(currentPage);
             currentPage = [item];
             currentHeight = height;
         } else {
             currentPage.push(item);
             currentHeight += height;
         }
     });

     if (currentPage.length > 0) {
         newPages.push(currentPage);
     }

     setPages(newPages);
     setIsComputing(false);

  }, [items, activeTab, isPrinting]);

  if (!data) return <div className="p-8 text-center text-gray-400">No data to preview</div>;

  if (activeTab === 'jd-match' && !isPrinting) {
       return (
            <div ref={ref} className="w-full h-full overflow-hidden flex justify-center items-start bg-transparent py-8 px-4">
                <div className="w-full max-w-4xl h-full bg-white soft-glow border-none rounded-2xl flex flex-col overflow-hidden">
                    <HighlightedResumeView 
                        resumeData={data} 
                        keywords={new Set(matchedKeywords.map(k => k.toLowerCase()))} 
                    />
                </div>
            </div>
       );
  }

  if (activeTab === 'cover-letter' && !isPrinting) {
       return (
            <div className="w-full h-full overflow-auto flex justify-center items-start bg-transparent py-8">
                <div style={{ width: `calc(210mm * ${scale})`, overflow: 'visible' }}>
                    <div 
                        ref={ref}
                        className="flex flex-col gap-8"
                        style={{ 
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left'
                        }}
                    >
                        <CoverLetterPreview
                            content={coverLetter}
                            personalInfo={data?.personalInfo}
                        />
                    </div>
                </div>
            </div>
       );
  }

  // ----------------------------------------------------------------------
  // MODE: SCREEN (Interactive, ZOOMABLE preview)
  // ----------------------------------------------------------------------
  return (
    <div className="min-w-full min-h-full w-fit flex justify-center items-start bg-transparent py-8 relative">
        {/* 
            MEASUREMENT CONTAINER (Hidden) 
            Must remain unscaled 1:1 for accurate pagination
            Wrapped in zero-size container to prevent layout shifts
        */}
        <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute', top: 0, left: 0 }}>
            <div 
                ref={containerRef} 
                className="opacity-0 pointer-events-none"
                style={{ 
                    width: template.includes('two') ? '140mm' : '210mm', // Main column width for measurement
                    padding: template.includes('two') ? '0mm' : '20mm',
                    visibility: 'hidden'
                }}
            >
                {items.map(item => (
                    <div key={item.id} className="overflow-hidden">
                        <ResumeItemRenderer item={item} template={template} accentColor={data.accentColor} />
                    </div>
                ))}
            </div>
        </div>

        {/* VISIBLE PAGES (SCALED) — Wrapper constrains layout width to scaled dimensions */}
        <div style={{ width: `calc(210mm * ${scale})`, overflow: 'visible' }}>
            <div 
                ref={ref}
                className="resume-preview-container flex flex-col gap-8"
                style={{ 
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left'
                }}
            >
                {pages.map((pageItems, pageIndex) => (
                    <div 
                        key={pageIndex}
                        className="resume-page bg-white soft-glow ring-1 ring-black/10 relative"
                        style={{
                            width: '210mm',
                            height: '297mm',
                            padding: template.includes('two') ? '0' : '20mm',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div className="h-full flex flex-col font-serif text-black leading-relaxed">
                            {template === 'classic-two' && (
                                <div className="grid grid-cols-[190px_1fr] h-full gap-8">
                                    <aside className="bg-gray-50/50 p-6 border-r border-gray-100 m-0 min-h-full">
                                        <ClassicTwoColumnSidebar data={data} accentColor={data.accentColor} />
                                    </aside>
                                    <main className="py-10 pr-10">
                                        {pageItems.map(item => (
                                            <div key={item.id}>
                                                <ClassicTwoColumnRenderer item={item} accentColor={data.accentColor} />
                                            </div>
                                        ))}
                                    </main>
                                </div>
                            )}
                            {template === 'modern-two' && (
                                <div className="grid grid-cols-[220px_1fr] h-full">
                                    <aside className="bg-slate-900 p-8 text-white min-h-full">
                                        <ModernTwoColumnSidebar data={data} accentColor={data.accentColor} />
                                    </aside>
                                    <main className="p-10 bg-white">
                                        {pageItems.map(item => (
                                            <div key={item.id}>
                                                <ModernTwoColumnRenderer item={item} accentColor={data.accentColor} />
                                            </div>
                                        ))}
                                    </main>
                                </div>
                            )}
                            {!template.includes('two') && (
                                <div className="h-full">
                                    {pageItems.map(item => (
                                        <div key={item.id}>
                                            <ResumeItemRenderer item={item} template={template} accentColor={data.accentColor} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-4 right-8 text-xs text-gray-400 font-sans print:hidden">
                            Page {pageIndex + 1} of {pages.length}
                        </div>
                    </div>
                ))}
                
                {pages.length === 0 && (
                    <div 
                        className="bg-white soft-glow flex items-center justify-center text-gray-400"
                        style={{ width: '210mm', height: '297mm' }}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <span>Preparing layout...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
