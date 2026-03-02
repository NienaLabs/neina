'use client';

import React, { useState, Suspense, useCallback, useMemo } from 'react';
import { useServerEvents } from '@/hooks/useServerEvents';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { RetroTabs } from '@/components/ui/retro-tabs';
import {
  ArrowLeft,
  Save,
  Download,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Palette,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Layout,
  FileText,
  BriefcaseBusiness,
  Mail,
  MessageSquare,
  Eye,
  ScanSearch
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
import { ResumeForm } from './ResumeForm';
import { ResumePreview } from './ResumePreview';
import { ResumePDF } from './ResumePDF';
import { CoverLetterPDF } from './CoverLetterPDF';
import { JobDescriptionPanel } from './JobDescriptionPanel';
import { CoverLetterEditor } from './CoverLetterEditor';
import { OutreachPanel } from './OutreachPanel';
import { GeneratePromptPanel } from './GeneratePromptPanel';
import { ResumeData, TemplateType } from '@/lib/types/resume';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { 
    ssr: false,
    loading: () => <Button size="sm" className="h-8 text-xs" disabled><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Loading...</Button>
  }
);

type TabId = 'resume' | 'cover-letter' | 'jd-match';

interface ResumeBuilderProps {
  initialData?: ResumeData;
  resumeId: string;
  jobDescription?: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  wordMatchScore?: number;
  status?: string;
  coverLetter?: string;
}

const ResumeBuilderContent = ({ 
    initialData, 
    resumeId,
    jobDescription = '',
    matchedKeywords = [],
    missingKeywords = [],
    wordMatchScore = 0,
    status = 'COMPLETED',
    coverLetter: initialCoverLetter = ''
}: ResumeBuilderProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('resume');
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'job-description' | 'cover-letter' | 'outreach'>('content');
  const [resumeData, setResumeData] = useState<ResumeData | null>(initialData || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.75);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);

  // Router, tRPC utils, and mutations
  const router = useRouter();
  const utils = trpc.useUtils();
  const {mutateAsync: retailor} = trpc.resume.retailor.useMutation();
  const {mutateAsync: updateCoverLetterMutation} = trpc.resume.updateCoverLetter.useMutation();
  const {mutateAsync: generateCoverLetterMutation} = trpc.resume.generateCoverLetter.useMutation();
  const {mutateAsync: generateOutreachMessageMutation} = trpc.resume.generateOutreachMessage.useMutation();

  // Sync state with prop changes (for when router.refresh() updates data)
  React.useEffect(() => {
      if (initialData) {
          // Merge custom sections into sectionMeta to ensure they appear in Preview
          const rawMeta = initialData.sectionMeta || []; 
          // Note: We need DEFAULT_SECTION_META if rawMeta is empty, but usually it comes from DB.
          // If it's empty, we might want to respect that (user deleted all?), but safe to assume we at least want defaults if null.
          const effectiveMeta = rawMeta.length > 0 ? rawMeta : []; // Import DEFAULT if needed, but simplistic match here.

          const customSectionKeys = Object.keys(initialData.customSections || {});
          const missingKeys = customSectionKeys.filter(key => !effectiveMeta.find(s => s.key === key));

          if (missingKeys.length > 0) {
              const newSections = missingKeys.map((key, index) => {
                 const sectionData = initialData.customSections?.[key];
                 return {
                     id: key,
                     key: key,
                     displayName: sectionData?.displayName || key.replace(/_/g, ' '),
                     isVisible: true,
                     isDefault: false,
                     sectionType: sectionData?.sectionType || 'itemList',
                     order: effectiveMeta.length + index
                 };
              });
              setResumeData({
                  ...initialData,
                  sectionMeta: [...effectiveMeta, ...newSections] as any
              });
          } else {
              setResumeData(initialData);
          }
      }
  }, [initialData]);

  // Job Description State
  const [jdText, setJdText] = useState(jobDescription);
  const [selectedPrompt, setSelectedPrompt] = useState('keywords');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Cover Letter State
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [isCoverLetterSaving, setIsCoverLetterSaving] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

  // Outreach State
  const [outreachMessage, setOutreachMessage] = useState('');
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

  // Handle updates from child components
  const onUpdate = useCallback((newData: ResumeData) => {
      setResumeData(newData);
      setHasUnsavedChanges(true);
  }, []);

  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    (initialData?.template as TemplateType) || 'classic-single'
  );

  // Initialize accent color to slate if not provided
  React.useEffect(() => {
    if (resumeData && !resumeData.accentColor) {
      onUpdate({ ...resumeData, accentColor: '#334155' });
    }
  }, [resumeData, onUpdate]);

  const handleTemplateChange = useCallback((val: string) => {
    const template = val as TemplateType;
    setSelectedTemplate(template);
    if (resumeData) {
        onUpdate({ ...resumeData, template });
    }
  }, [onUpdate, resumeData]);

  const handleColorChange = useCallback((color: string) => {
    if (resumeData) {
        onUpdate({ ...resumeData, accentColor: color });
    }
  }, [onUpdate, resumeData]);

  // Sync state with prop changes (cover letter)
  React.useEffect(() => {
    if (initialCoverLetter) {
        setCoverLetter(initialCoverLetter);
    }
    if (initialData?.template) {
        setSelectedTemplate(initialData.template as TemplateType);
    }
  }, [initialCoverLetter, initialData?.template]);

    // Listen for SSE events instead of polling for status updates
    useServerEvents((event) => {
      // Helper to check if an event belongs to this resume
      const isForThisResume = 'resumeId' in event.data && event.data.resumeId === resumeId;

      if (!isForThisResume) return;
  
      if (event.type === 'TAILORED_RESUME_READY' || event.type === 'COVER_LETTER_READY') {
        console.log(`🚀 [SSE] ${event.type} received for resume ${resumeId}`);
        setProcessingAction(null);
        setIsGeneratingCoverLetter(false);

        if (event.type === 'TAILORED_RESUME_READY') {
             const action = event.data.action || 'refinement';
             toast.success(`Resume ${action} complete!`);
        } else {
             toast.success('Cover letter generated successfully!');
        }
        router.refresh();
      }
  
      if (event.type === 'TAILORED_RESUME_FAILED') {
        console.error(`❌ [SSE] ${event.type} received for resume ${resumeId}`);
        setProcessingAction(null);
        setIsGeneratingCoverLetter(false);
        toast.error('Resume processing failed. Please try again.');
        router.refresh();
      }

      if (event.type === 'OUTREACH_MESSAGE_READY') {
        console.log(`🚀 [SSE] ${event.type} received for resume ${resumeId}`);
        setOutreachMessage(event.data.message);
        setIsGeneratingOutreach(false);
        toast.success('Outreach message generated!');
      }

      if (event.type === 'OUTREACH_MESSAGE_FAILED') {
        console.error(`❌ [SSE] ${event.type} received for resume ${resumeId}`);
        setIsGeneratingOutreach(false);
        toast.error('Failed to generate outreach message.');
      }

      if (event.type === 'ITEM_REGENERATED_READY') {
          console.log(`🚀 [SSE] ITEM_REGENERATED_READY received for resume ${resumeId}`);
          const { itemId, newBullets, changeSummary } = event.data;
          setResumeData(prev => {
              if (!prev) return null;
              const newWork = prev.workExperience?.map(item => 
                  item.id === itemId ? { ...item, description: newBullets } : item
              ) || [];
              const projWork = prev.personalProjects?.map(item => 
                  item.id === itemId ? { ...item, description: newBullets } : item
              ) || [];
              
              const updatedData = { ...prev, workExperience: newWork, personalProjects: projWork };
              return updatedData;
          });
          setHasUnsavedChanges(true);
          setProcessingAction(null);
          toast.success('Description regenerated!', {
            description: changeSummary || undefined,
            duration: changeSummary ? 6000 : 3000,
          });
      }

      if (event.type === 'SKILLS_REGENERATED_READY') {
          console.log(`🚀 [SSE] SKILLS_REGENERATED_READY received for resume ${resumeId}`);
          const { newSkills, changeSummary } = event.data;
          setResumeData(prev => {
              if (!prev) return null;
               const updatedAdditional = {
                   ...prev.additional,
                   technicalSkills: newSkills
               };
               return { ...prev, additional: updatedAdditional };
          });
          setHasUnsavedChanges(true);
          setProcessingAction(null);
          toast.success('Skills regenerated!', {
            description: changeSummary || undefined,
            duration: changeSummary ? 6000 : 3000,
          });
      }

      if (event.type === 'ITEM_REGENERATED_FAILED' || event.type === 'SKILLS_REGENERATED_FAILED') {
          console.error(`❌ [SSE] ${event.type} received`);
          setProcessingAction(null);
          toast.error(`Regeneration failed. Please try again.`);
      }
    });

  const handleGenerateTailored = async (mode?: string) => {
    if (!resumeId || !jdText.trim()) return;
    
    // We are in the Tailored Resume Builder, so we always want to RETAILOR the CURRENT resume.
    // The resumeId prop is the ID of the tailored resume we are editing.

    const tailoringMode = mode || selectedPrompt;
    
    setProcessingAction(tailoringMode);
    try {
       const result = await retailor({
           resumeId: resumeId, // Use the current tailored resume ID
           jobDescription: jdText,
           tailoringMode: tailoringMode as any
       });
       
       if(result && 'id' in result){
            toast.success(`Resume refinement started (${tailoringMode}). AI is working...`);
            // We stay on the page. SSE will handle the completion.
            router.refresh(); 
       }
    } catch (error) {
        console.error("Failed to re-tailor resume:", error);
        toast.error("Failed to start refinement process");
        setProcessingAction(null);
    } 
    // Do NOT clear processingAction in finally - wait for SSE
  };

  // TRPC Mutation to save data
  const { mutate: saveResume, isPending: isSaving } = trpc.resume.saveData.useMutation({
    onSuccess: () => {
        setHasUnsavedChanges(false);
        // Toast could go here
    },
    onError: (err) => {
        console.error("Failed to save resume", err);
        // Toast error
    }
  });

  const handleSave = useCallback(() => {
    if (!resumeData) return;
    
    // Optimistic UI update already happened via local state
    saveResume({
        resumeId,
        extractedData: resumeData,
        isTailored: true // For now assuming tailored page uses this
    });
  }, [resumeData, resumeId, saveResume]);



  // Cover Letter Handlers
  const handleSaveCoverLetter = useCallback(async () => {
    if (!resumeId || !coverLetter) return;
    
    setIsCoverLetterSaving(true);
    try {
      await updateCoverLetterMutation({
        resumeId,
        coverLetter
      });
      toast.success('Cover letter saved successfully');
    } catch (error) {
      console.error('Failed to save cover letter:', error);
      toast.error('Failed to save cover letter');
    } finally {
      setIsCoverLetterSaving(false);
    }
  }, [resumeId, coverLetter, updateCoverLetterMutation]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!resumeId) return;
    
    setIsGeneratingCoverLetter(true);
    try {
      await generateCoverLetterMutation({ resumeId });
      toast.success('Cover letter generation started. AI is working...');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to generate cover letter:', error);
      toast.error(error.message || 'Failed to generate cover letter');
      setIsGeneratingCoverLetter(false);
    } 
    // Finally block removed: we want loading state to persist until status update or refresh
  }, [resumeId, generateCoverLetterMutation, router]);

  const handleRegenerateCoverLetter = useCallback(async () => {
    if (!coverLetter) {
      handleGenerateCoverLetter();
      return;
    }
    
    // Confirm regeneration
    if (!confirm('Are you sure you want to regenerate the cover letter? This will replace the current content.')) {
      return;
    }
    
    handleGenerateCoverLetter();
  }, [coverLetter, handleGenerateCoverLetter]);

  const handleGenerateOutreach = useCallback(async () => {
    if (!resumeId) return;
    
    setIsGeneratingOutreach(true);
    try {
        await generateOutreachMessageMutation({ resumeId });
        toast.success('Generating outreach message...');
    } catch (error) {
        console.error("Failed to generate outreach message:", error);
        toast.error("Failed to start generation");
        setIsGeneratingOutreach(false);
    }
  }, [resumeId, generateOutreachMessageMutation]);

  // Show toast notification if job is taking too long
  React.useEffect(() => {
    if (status === 'PENDING' || status === 'PROCESSING') {
      const timer = setTimeout(() => {
        toast.info(
          "Still processing... This is taking longer than expected. Try refreshing the page.",
          { duration: 8000 }
        );
      }, 30000); // 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div
      className="min-h-screen w-full bg-background flex justify-center items-start py-2 px-2 md:py-3 md:px-4 overflow-x-hidden"
    >
        {/* Main Container */}
      <div className="w-full min-h-[calc(100vh-2rem)] max-w-[92%] md:max-w-[96%] xl:max-w-[2000px] bg-white dark:bg-card shadow-2xl border border-black/5 rounded-3xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-black/5 p-3 md:p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md">
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                     <Button
                        variant="link"
                        onClick={() => router.push('/dashboard')}
                        className="mb-1 -ml-1 pl-0 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white h-auto py-0 text-xs"
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Back to Dashboard
                      </Button>
                      <h1 className="font-serif text-2xl md:text-3xl text-black dark:text-white tracking-tight leading-none uppercase">
                        Resume Builder
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-xs font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wide font-bold">
                            {'// '} Tailored Edit Mode
                         </p>
                         {hasUnsavedChanges && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded-md">
                                <AlertTriangle className="w-3 h-3" />
                                Unsaved
                            </span>
                         )}
                      </div>
                </div>

                <div className="flex items-center gap-1 mr-4 border-x border-black/10 px-3 h-10">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 rounded-xl transition-all ${isLeftPanelVisible ? 'bg-black/5 text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-400 hover:bg-black/5'}`}
                      onClick={() => setIsLeftPanelVisible(prev => !prev)}
                      title={`Editor ${isLeftPanelVisible ? 'ON' : 'OFF'}`}
                    >
                      {isLeftPanelVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 rounded-xl transition-all ${isRightPanelVisible ? 'bg-black/5 text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-400 hover:bg-black/5'}`}
                      onClick={() => setIsRightPanelVisible(prev => !prev)}
                      title={`Preview ${isRightPanelVisible ? 'ON' : 'OFF'}`}
                    >
                      {isRightPanelVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                    {activeTab === 'resume' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleGenerateTailored()} title="Regenerate">
                            <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHasUnsavedChanges(false)} title="Reset">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          className="h-8 w-8 bg-white/50" 
                          onClick={handleSave} 
                          disabled={isSaving}
                          title={isSaving ? 'Saving...' : 'Save'}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        
                         <PDFDownloadLink
                            document={<ResumePDF data={resumeData || {} as any} template={selectedTemplate} />}
                            fileName={`Resume-${resumeData?.personalInfo?.name || 'Tailored'}.pdf`}
                        >
                            {({ loading }) => (
                                <Button variant="default" size="icon" className="bg-green-600 hover:bg-green-700 h-8 w-8 shadow-sm" disabled={loading} title={loading ? 'Generating...' : 'Export PDF'}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                </Button>
                            )}
                        </PDFDownloadLink>
                      </>
                    )}
                    {activeTab === 'cover-letter' && coverLetter && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRegenerateCoverLetter} title="Regenerate">
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 bg-white/50" onClick={handleSaveCoverLetter} disabled={isCoverLetterSaving} title={isCoverLetterSaving ? 'Saving...' : 'Save'}>
                          {isCoverLetterSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        
                        <PDFDownloadLink
                          document={<CoverLetterPDF content={coverLetter} personalInfo={resumeData?.personalInfo} />}
                          fileName={`CoverLetter-${resumeData?.personalInfo?.name || 'Tailored'}.pdf`}
                        >
                          {({ loading }) => (
                            <Button variant="default" size="icon" className="bg-green-600 hover:bg-green-700 h-8 w-8 shadow-sm" disabled={loading} title={loading ? 'Generating...' : 'Export PDF'}>
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      </>
                    )}
                </div>
             </div>
          </div>


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
                 <div className="px-6 md:px-8 pt-6 md:pt-8 shrink-0 bg-transparent border-b border-black/5">
                     <RetroTabs 
                        tabs={[
                            { id: 'content', label: 'Content', icon: <FileText className="w-3.5 h-3.5" /> },
                            { id: 'job-description', label: 'Job Description', icon: <BriefcaseBusiness className="w-3.5 h-3.5" /> },
                            { id: 'cover-letter', label: 'Cover Letter', icon: <Mail className="w-3.5 h-3.5" /> },
                            { id: 'outreach', label: 'Outreach', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                        ]}
                        activeTab={activeEditorTab}
                        onTabChange={(id) => setActiveEditorTab(id as any)}
                     />
                 </div>
                 <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8">
                     <div className="max-w-4xl mx-auto space-y-6">
                        {activeEditorTab === 'content' && (
                            <ResumeForm 
                                resumeData={resumeData} 
                                onUpdate={onUpdate} 
                                resumeId={resumeId}
                                onRegenerateStart={(type) => setProcessingAction(type)} 
                            />
                        )}
                        {activeEditorTab === 'job-description' && (
                            <JobDescriptionPanel 
                                jobDescription={jdText}
                                onJobDescriptionChange={setJdText}
                                selectedPrompt={selectedPrompt}
                                onPromptChange={setSelectedPrompt}
                                onGenerate={handleGenerateTailored}
                                isGenerating={!!processingAction || status === 'PENDING' || status === 'PROCESSING'}
                                matchedKeywords={matchedKeywords}
                                missingKeywords={missingKeywords}
                            />
                        )}
                        {activeEditorTab === 'cover-letter' && (
                          coverLetter ? (
                            <CoverLetterEditor
                              content={coverLetter}
                              onChange={setCoverLetter}
                              onSave={handleSaveCoverLetter}
                              isSaving={isCoverLetterSaving}
                            />
                          ) : (
                            <GeneratePromptPanel
                              onGenerate={handleGenerateCoverLetter}
                              isGenerating={isGeneratingCoverLetter}
                            />
                          )
                        )}
                        {activeEditorTab === 'outreach' && (
                            <OutreachPanel 
                                content={outreachMessage}
                                onChange={setOutreachMessage}
                                onGenerate={handleGenerateOutreach}
                                isGenerating={isGeneratingOutreach}
                            />
                        )}
                     </div>

                 </div>
             </div>

             {/* Right Panel: Preview */}
             <div className={`${!isRightPanelVisible ? 'hidden' : 'flex'} bg-slate-200/50 dark:bg-black/40 flex-col min-h-0 relative group`}>
                 {/* Tab row + zoom (same line) */}
                 <div className="px-4 md:px-6 pt-4 shrink-0 bg-transparent border-b border-black/10 flex items-end justify-between gap-4">
                     <RetroTabs
                         tabs={[
                             { id: 'resume', label: 'Resume', icon: <Eye className="w-3.5 h-3.5" /> },
                             { id: 'cover-letter', label: 'Cover Letter', icon: <Mail className="w-3.5 h-3.5" /> },
                             { id: 'jd-match', label: 'JD Match', icon: <ScanSearch className="w-3.5 h-3.5" /> },
                         ]}
                         activeTab={activeTab}
                         onTabChange={(id) => setActiveTab(id as TabId)}
                     />
                     {/* Zoom — right-aligned in same row as tabs */}
                     <div className="flex items-center gap-1 bg-white/70 rounded-lg px-2 py-1 border border-black/8 mb-2 shrink-0">
                         <Button
                             variant="ghost"
                             size="sm"
                             className="h-5 w-5 p-0 rounded hover:bg-gray-100"
                             onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
                             disabled={previewScale <= 0.3}
                         >
                             <ZoomOut className="w-3 h-3 text-black" />
                         </Button>
                         <span className="text-[10px] font-bold text-black w-7 text-center">
                             {Math.round(previewScale * 100)}%
                         </span>
                         <Button
                             variant="ghost"
                             size="sm"
                             className="h-5 w-5 p-0 rounded hover:bg-gray-100"
                             onClick={() => setPreviewScale(s => Math.min(1.5, s + 0.1))}
                             disabled={previewScale >= 1.5}
                         >
                             <ZoomIn className="w-3 h-3 text-black" />
                         </Button>
                     </div>
                 </div>
                 {/* Template + Accent + Collapse row */}
                 <div className="px-4 md:px-6 py-2 shrink-0 flex items-center justify-between gap-2 border-b border-black/5">
                     <div className="flex items-center gap-1.5 bg-white/50 rounded-lg px-2 py-1 border border-black/8 text-[10px]">
                         <span className="font-bold uppercase text-gray-400">Template</span>
                         <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                             <SelectTrigger className="h-5 w-[130px] text-[10px] border-none shadow-none focus:ring-0 bg-transparent font-bold font-mono p-0">
                                 <SelectValue placeholder="Template" />
                             </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="classic-single">Classic Single</SelectItem>
                                 <SelectItem value="modern-single">Modern Single</SelectItem>
                                 <SelectItem value="classic-two">Classic Two Col</SelectItem>
                                 <SelectItem value="modern-two">Modern Two Col</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1.5 bg-white/50 rounded-lg px-2 py-1 border border-black/8">
                             <span className="text-[10px] font-bold uppercase text-gray-400">Accent</span>
                             <div className="flex gap-1 items-center">
                                 {[
                                     { name: 'Slate', value: '#334155' },
                                     { name: 'Blue', value: '#2563eb' },
                                     { name: 'Emerald', value: '#059669' },
                                     { name: 'Violet', value: '#7c3aed' },
                                     { name: 'Rose', value: '#e11d48' },
                                     { name: 'Amber', value: '#d97706' },
                                 ].map((c) => (
                                     <button
                                         key={c.value}
                                         onClick={() => handleColorChange(c.value)}
                                         className="w-3.5 h-3.5 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                                         style={{ backgroundColor: c.value }}
                                         title={c.name}
                                     >
                                         {resumeData?.accentColor === c.value && <Check className="w-2 h-2 text-white" />}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         {/* Collapse button — right side of controls row, no overlap with zoom */}
                         <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7 rounded-full bg-white/90 hover:bg-white soft-glow border-none flex items-center justify-center p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => setIsRightPanelVisible(false)}
                             title="Collapse Preview"
                         >
                             <PanelRightClose className="w-4 h-4 text-slate-700" />
                         </Button>
                     </div>
                 </div>
                 {/* rotateX(180deg) on outer flips the horizontal scrollbar to the top;
                     counter-rotate on inner keeps content visually upright */}
                 <div className="flex-1 overflow-auto min-h-0 bg-transparent transform-[rotateX(180deg)]">
                     <div className="p-4 md:p-6 min-h-full transform-[rotateX(180deg)]">
                         <ResumePreview
                             data={resumeData}
                             activeTab={activeTab}
                             template={selectedTemplate}
                             wordMatchScore={wordMatchScore}
                             matchedKeywords={matchedKeywords}
                             missingKeywords={missingKeywords}
                             jobDescription={jdText}
                             scale={previewScale}
                             coverLetter={coverLetter}
                         />
                     </div>
                 </div>
             </div>
          </div>



          
          {/* Footer — panel toggles only, controls moved to preview panel header */}
         <div className="px-4 py-2 md:px-5 md:py-2.5 bg-background/80 backdrop-blur-md flex justify-between items-center font-mono text-xs text-slate-700 border-t border-black/5 print:hidden z-50 relative">
           <div className="flex items-center gap-4">
             <span className="uppercase font-bold flex items-center gap-2">
                Niena Module
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
         </div>
       </div>
       {/* Processing Notification — non-blocking floating indicator */}
      {(!!processingAction || isGeneratingCoverLetter || status === 'PENDING' || status === 'PROCESSING') && (
        <div className="fixed bottom-24 right-6 z-[100] flex items-center gap-3 bg-white border border-black/10 shadow-xl rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-4 fade-in">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
            <div className="flex flex-col">
              <p className="font-semibold text-sm leading-tight">
                {isGeneratingCoverLetter ? 'Generating Cover Letter' : 
                 (processingAction ? 
                    (processingAction === 'enrich' ? 'Enriching Content' : 
                     processingAction === 'refine' ? 'Refining & Polishing' :
                     processingAction === 'keywords' ? 'Optimizing Keywords' :
                     processingAction === 'nudge' ? 'Nudging Content' :
                     processingAction === 'full' ? 'Full Re-Tailoring' : 
                     `Processing`) 
                 : 'Refining Resume')}
              </p>
              <p className="text-xs text-muted-foreground">AI is working in the background…</p>
            </div>
        </div>
      )}
    </div>
  );
};

export const ResumeBuilder = (props: ResumeBuilderProps) => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResumeBuilderContent {...props} />
        </Suspense>
    )
}
