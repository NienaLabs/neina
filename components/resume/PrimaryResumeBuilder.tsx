'use client';

import React, { useState, Suspense, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { RetroTabs } from '@/components/ui/retro-tabs';
import {
  ArrowLeft,
  Save,
  Download,
  Layout,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  Check,
  Loader2,
  Wand2,
  RotateCcw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import ResumeEditor, { ResumeEditorRef } from '@/components/resume/editor';
import { ResumePreview } from '@/components/resume/tailored/ResumePreview';
import { ResumePDF } from '@/components/resume/tailored/ResumePDF';
import { ResumeExtraction, Fixes } from '@/components/resume/editor/types';
import { ResumeData, TemplateType } from '@/lib/types/resume';
import { mapExtractionToResumeData } from '@/lib/resume-utils';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { 
    ssr: false,
    loading: () => <Button size="sm" className="h-8 text-xs" disabled><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Loading...</Button>
  }
);

import { StarRatingDisplay } from '@/components/resume/StarRatingDisplay';
import { FeatureGuide } from '@/components/FeatureGuide';
import { ReanalyzeButton } from '@/components/resume/ReanalyzeButton';
import { ResumeReportSidebar } from '@/components/resume/ResumeReportSidebar';

interface PrimaryResumeBuilderProps {
  initialData: ResumeExtraction;
  resumeId: string;
  fixes: Fixes;
  resumeName?: string;
  isTailored?: boolean;
  starRating?: number;
  totalIssues?: number;
  score?: {
      overallScore?: number;
      experienceScore?: number;
      skillsScore?: number;
  } | null;
}

const PrimaryResumeBuilderContent = ({ 
    initialData, 
    resumeId,
    fixes,
    resumeName = "My Resume",
    isTailored = false,
    starRating = 0,
    totalIssues = 0,
    score
}: PrimaryResumeBuilderProps) => {
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<'resume'>('resume');
  const [activeEditorTab, setActiveEditorTab] = useState<'content'>('content');
  const [extractionData, setExtractionData] = useState<ResumeExtraction>(initialData);
  const [previewScale, setPreviewScale] = useState(0.65);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const editorRef = useRef<ResumeEditorRef>(null);
  const [canUndo, setCanUndo] = useState(false);

  // Template & Accent Color State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    (initialData.template as TemplateType) || 'classic-single'
  );
  
  // NOTE: accentColor is stored in ResumeExtraction now, ensuring sync
  const accentColor = extractionData.accentColor || '#334155';

  // Derived ResumeData for Preview
  const resumeData = useMemo(() => {
      const data = mapExtractionToResumeData(extractionData, resumeName);
      // Ensure template and accent color are synced in derived data
      return {
          ...data,
          template: selectedTemplate,
          accentColor: accentColor
      };
  }, [extractionData, resumeName, selectedTemplate, accentColor]);

  // Handlers
  const handleTemplateChange = useCallback((val: string) => {
    const template = val as TemplateType;
    setSelectedTemplate(template);
    // We update extraction data to persist template choice
    setExtractionData(prev => ({ ...prev, template }));
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setExtractionData(prev => ({ ...prev, accentColor: color }));
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-background flex justify-center items-start py-2 px-2 md:py-3 md:px-4 overflow-x-hidden"
    >
      <div className="w-full h-[160vh] max-w-[92%] md:max-w-[96%] xl:max-w-[2000px] bg-white dark:bg-card shadow-2xl border border-black/5 rounded-3xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-black/5 p-3 md:p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md">
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                     
                      <h1 className="font-serif text-2xl md:text-3xl text-black dark:text-white tracking-tight leading-none uppercase">
                        Resume Editor
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-xs font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wide font-bold">
                            {'// '} Primary Resume
                         </p>
                      </div>
                </div>

                <div className="flex items-center gap-3 mr-4 border-x border-black/10 px-4 h-10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 gap-2 font-mono text-[10px] uppercase font-bold transition-all rounded-xl ${isLeftPanelVisible ? 'bg-black/5 text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-400 hover:bg-black/5'}`}
                      onClick={() => setIsLeftPanelVisible(prev => !prev)}
                    >
                      <Layout className="w-3 h-3" />
                      Editor {isLeftPanelVisible ? 'ON' : 'OFF'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 gap-2 font-mono text-[10px] uppercase font-bold transition-all rounded-xl ${isRightPanelVisible ? 'bg-black/5 text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-400 hover:bg-black/5'}`}
                      onClick={() => setIsRightPanelVisible(prev => !prev)}
                    >
                      <Layout className="w-3 h-3" />
                      Preview {isRightPanelVisible ? 'ON' : 'OFF'}
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                     <PDFDownloadLink
                        document={<ResumePDF data={resumeData} template={selectedTemplate} />}
                        fileName={`Resume-${resumeData.personalInfo.name}.pdf`}
                    >
                        {({ loading }) => (
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" disabled={loading}>
                                {loading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Download className="w-3 h-3 mr-1.5" />}
                                {loading ? 'Generating...' : 'Export PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
             </div>
          </div>

          {/* Stats / Grade Header (Restored) */}
          <div className="relative overflow-hidden border-b bg-linear-to-r from-background via-muted/30 to-background p-6 md:p-8">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                  
                  {/* Star Rating Display */}
                  <div className="flex items-center gap-6">
                      <StarRatingDisplay 
                          rating={starRating} 
                          label={isTailored ? 'Overall Quality' : 'Resume Health'}
                          score={!isTailored && totalIssues !== undefined ? Math.max(0, 100 - (totalIssues * 2)) : undefined}
                      />
                      
                      <div className="h-12 w-px bg-border hidden md:block" />

                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold tracking-tight">
                                  {isTailored ? 'Tailored Analysis' : 'Issue Detection'}
                              </h2>
                              <FeatureGuide 
                                  title={isTailored ? "Tailored Analysis" : "Issue Detection"}
                                  description="Review and fix issues found in your resume. Use Auto-fix to instantly resolve common problems. After applying fixes, **Save** your changes and click **Re-analyze** to update your score."
                              />
                          </div>
                          <p className="text-sm text-muted-foreground max-w-[250px]">
                              {isTailored 
                                  ? "Based on alignment with the job description." 
                                  : `${totalIssues} issues found. Fix them to improve your rating.`}
                          </p>
                      </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="flex-1 w-full md:w-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-1 ">
                          {isTailored && score && (
                              // Tailored Resume Stats
                              <>      
                                  <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white shadow-sm">
                                          <span className="font-bold text-sm">{((score.experienceScore || 0) * 100).toFixed(0)}%</span>
                                      </div>
                                      <span className="text-xs font-medium text-muted-foreground text-center">Experience</span>
                                  </div>
                                  <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                          <span className="font-bold text-sm">{((score.skillsScore || 0) * 100).toFixed(0)}%</span>
                                      </div>
                                      <span className="text-xs font-medium text-muted-foreground text-center">Skills</span>
                                  </div>
                                  {score.overallScore !== undefined && (
                                      <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                              <span className="font-bold text-sm">{(score.overallScore * 100).toFixed(0)}%</span>
                                          </div>
                                          <span className="text-xs font-medium text-muted-foreground text-center">Role Match</span>
                                      </div>
                                  )}
                              </>
                          )}
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 min-w-[140px]">
                      <ReanalyzeButton resumeId={resumeId} isTailored={isTailored} />
                      <ResumeReportSidebar fixes={fixes} />
                  </div>
              </div>
          </div>

          {/* Content Grid */}
          {/* Content Grid */}
          <div className={`grid grid-cols-1 ${isLeftPanelVisible && isRightPanelVisible ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} bg-black/5 gap-[1px] flex-1 min-h-0`}>
             {/* Left Panel: Editor */}
             <div className={`${!isLeftPanelVisible ? 'hidden' : 'flex'} bg-white dark:bg-card flex-col min-h-0 relative group`}>
                 <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/90 hover:bg-white soft-glow border-none flex items-center justify-center p-0"
                      onClick={() => setIsLeftPanelVisible(false)}
                      title="Collapse Editor"
                    >
                      <PanelLeftClose className="w-4 h-4 text-slate-700" />
                    </Button>
                 </div>
                 <div className="px-6 md:px-8 pt-6 md:pt-8 shrink-0 bg-transparent border-b-2 border-black/5 flex justify-between items-end">
                     <RetroTabs 
                        tabs={[
                            { id: 'content', label: 'Editor' },
                        ]}
                        activeTab={activeEditorTab}
                        onTabChange={(id) => setActiveEditorTab(id as any)}
                     />
                     <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-black/20"
                            onClick={() => editorRef.current?.undo()}
                            disabled={!canUndo}
                            title="Undo last change"
                        >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Undo
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={() => editorRef.current?.applyAllFixes()}
                        >
                            <Wand2 className="w-3 h-3 mr-1" />
                            Auto Fix
                        </Button>
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
                     <div className="max-w-4xl mx-auto space-y-6">
                        <ResumeEditor 
                            fixes={fixes} 
                            extractedData={extractionData} 
                            resumeId={resumeId} 
                            isTailored={false} 
                            onStateChange={setExtractionData}
                            template={selectedTemplate}
                            ref={editorRef}
                            onHistoryChange={setCanUndo}
                        />
                     </div>
                 </div>
             </div>

             {/* Right Panel: Preview */}
             <div className={`${!isRightPanelVisible ? 'hidden' : 'flex'} bg-slate-200/50 dark:bg-black/40 flex-col min-h-0 relative group`}>
                 <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/90 hover:bg-white soft-glow border-none flex items-center justify-center p-0"
                      onClick={() => setIsRightPanelVisible(false)}
                      title="Collapse Preview"
                    >
                      <PanelRightClose className="w-4 h-4 text-slate-700" />
                    </Button>
                 </div>
                 <div className="px-6 md:px-8 pt-4 md:pt-5 shrink-0 bg-transparent">
                     <RetroTabs 
                        tabs={[
                            { id: 'resume', label: 'Preview' },
                        ]}
                        activeTab={activeTab}
                        onTabChange={(id) => setActiveTab(id as any)}
                     />
                 </div>
                 <div className="flex-1 overflow-auto min-h-0 p-4 md:p-6 bg-transparent">
                      <ResumePreview 
                        data={resumeData} 
                        activeTab={activeTab}
                        template={selectedTemplate}
                        scale={previewScale}
                     />
                 </div>
             </div>
          </div>

        {/* Footer */}
        <div className="px-4 py-2 md:px-5 md:py-2.5 bg-background/80 backdrop-blur-md flex justify-between items-center font-mono text-xs text-slate-700 border-t border-black/5 print:hidden z-50 relative">
          <div className="flex items-center gap-4">
            <span className="uppercase font-bold flex items-center gap-2">
               Resume Editor
            </span>
            <div className="flex items-center gap-1 border-l border-slate-300 pl-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-7 px-2 text-[10px] uppercase font-bold transition-colors ${isLeftPanelVisible ? 'text-slate-900 bg-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  onClick={() => setIsLeftPanelVisible(prev => !prev)}
                >
                  Editor
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-7 px-2 text-[10px] uppercase font-bold transition-colors ${isRightPanelVisible ? 'text-slate-900 bg-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  onClick={() => setIsRightPanelVisible(prev => !prev)}
                >
                  Preview
                </Button>
              {(!isLeftPanelVisible || !isRightPanelVisible) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setIsLeftPanelVisible(true);
                    setIsRightPanelVisible(true);
                  }}
                >
                  Reset View
                </Button>
              )}
            </div>
          </div>
           <div className="flex items-center gap-3 flex-wrap justify-end">
             <div className="flex items-center gap-3 bg-white/50 rounded-xl px-3 py-1 border border-black/5 soft-glow">
                <span className="text-[10px] font-bold uppercase text-gray-400">Template</span>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-6 w-[160px] text-[10px] border-none shadow-none focus:ring-0 bg-transparent font-bold font-mono">
                        <SelectValue placeholder="Select Template" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="classic-single">Classic (Single Column)</SelectItem>
                        <SelectItem value="modern-single">Modern (Single Column)</SelectItem>
                        <SelectItem value="classic-two">Classic (Two Column)</SelectItem>
                        <SelectItem value="modern-two">Modern (Two Column)</SelectItem>
                    </SelectContent>
                </Select>
             </div>

             <div className="flex items-center gap-3 bg-white/50 rounded-xl px-3 py-1 border border-black/5 soft-glow">
                <span className="text-[10px] font-bold uppercase text-gray-400">Accent</span>
                <div className="flex gap-1.5 items-center">
                    {[
                        { name: 'Blue', value: '#2563eb' },
                        { name: 'Emerald', value: '#059669' },
                        { name: 'Violet', value: '#7c3aed' },
                        { name: 'Rose', value: '#e11d48' },
                        { name: 'Amber', value: '#d97706' },
                        { name: 'Slate', value: '#334155' }
                    ].map((c) => (
                        <button
                            key={c.value}
                            onClick={() => handleColorChange(c.value)}
                            className="w-4 h-4 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                        >
                            {accentColor === c.value && <Check className="w-2.5 h-2.5 text-white" />}
                        </button>
                    ))}
                </div>
             </div>

             <div className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-1.5 border border-black/5 soft-glow">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full hover:bg-gray-100"
                    onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
                    disabled={previewScale <= 0.3}
                >
                    <ZoomOut className="w-3 h-3 text-black" />
                </Button>
                <span className="text-[10px] font-bold text-black w-8 text-center bg-transparent">
                    {Math.round(previewScale * 100)}%
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full hover:bg-gray-100"
                    onClick={() => setPreviewScale(s => Math.min(1.5, s + 0.1))}
                    disabled={previewScale >= 1.5}
                >
                    <ZoomIn className="w-3 h-3 text-black" />
                </Button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const PrimaryResumeBuilder = (props: PrimaryResumeBuilderProps) => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrimaryResumeBuilderContent {...props} />
        </Suspense>
    )
}
