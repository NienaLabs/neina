'use client';
import React, { useState, Suspense, useCallback } from 'react';
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
  Layout
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
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'job-description' | 'cover-letter'>('content');
  const [resumeData, setResumeData] = useState<ResumeData | null>(initialData || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.65);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);

  // Router, tRPC utils, and mutations
  const router = useRouter();
  const utils = trpc.useUtils();
  const {mutateAsync: retailor} = trpc.resume.retailor.useMutation();
  const {mutateAsync: updateCoverLetterMutation} = trpc.resume.updateCoverLetter.useMutation();
  const {mutateAsync: generateCoverLetterMutation} = trpc.resume.generateCoverLetter.useMutation();

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

  // Poll for status updates when PENDING
  const { data: pollingData } = trpc.resume.getUnique.useQuery(
    { resumeId },
    { 
       enabled: status === 'PENDING' || status === 'PROCESSING',
       refetchInterval: 5000 // 5 seconds to reduce overhead
    }
  );

  // Invalidate query when status changes to completed or failed
  React.useEffect(() => {
    if (pollingData?.status === 'COMPLETED' || pollingData?.status === 'FAILED') {
        // Invalidate the query to refetch without full page re-render
        utils.resume.getUnique.invalidate({ resumeId });
    }
  }, [pollingData?.status, utils, resumeId]);
  
  // Job Description State
  const [jdText, setJdText] = useState(jobDescription);
  const [selectedPrompt, setSelectedPrompt] = useState('keywords');
  const [isGenerating, setIsGenerating] = useState(false);

  // Cover Letter State
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [isCoverLetterSaving, setIsCoverLetterSaving] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

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



  const handleGenerateTailored = async (mode?: string) => {
    if (!resumeId || !jdText.trim()) return;
    
    // We are in the Tailored Resume Builder, so we always want to RETAILOR the CURRENT resume.
    // The resumeId prop is the ID of the tailored resume we are editing.

    const tailoringMode = mode || selectedPrompt;
    
    setIsGenerating(true);
    try {
       const result = await retailor({
           resumeId: resumeId, // Use the current tailored resume ID
           jobDescription: jdText,
           tailoringMode: tailoringMode as any
       });
       
       if(result && 'id' in result){
            toast.success(`Resume refinement started (${tailoringMode}). AI is working...`);
            // We stay on the page. The subscription/polling elsewhere should pick up the status change.
            // For now, we manually set isGenerating to true until we get a status update? 
            // Actually, the mutation returns the updated resume.
            // We might want to trigger a refresh of the data or rely on Inngest to finish.
            // The Page component might need to revalidate.
            router.refresh(); 
       }
    } catch (error) {
        console.error("Failed to re-tailor resume:", error);
        toast.error("Failed to start refinement process");
    } finally {
        setIsGenerating(false);
    }
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
      className="min-h-screen w-full bg-[#F0F0E8] flex justify-center items-start py-2 px-2 md:py-3 md:px-4 overflow-x-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(51, 65, 85, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(51, 65, 85, 0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
        {/* Main Container */}
      <div className="w-full h-[140vh] max-w-[92%] md:max-w-[96%] xl:max-w-[2000px] border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-black p-3 md:p-4 bg-[#F0F0E8]">
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                     <Button
                        variant="link"
                        onClick={() => router.push('/dashboard')}
                        className="mb-1 -ml-1 pl-0 text-black hover:text-blue-700 h-auto py-0"
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Back to Dashboard
                      </Button>
                      <h1 className="font-serif text-2xl md:text-3xl text-black tracking-tight leading-none uppercase">
                        Resume Builder
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-xs font-mono text-slate-700 uppercase tracking-wide font-bold">
                            {'// '} Edit Mode
                         </p>
                         {hasUnsavedChanges && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                Unsaved
                            </span>
                         )}
                      </div>
                </div>

                <div className="flex items-center gap-3 mr-4 border-x border-black/10 px-4 h-10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 gap-2 font-mono text-[10px] uppercase font-bold transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isLeftPanelVisible ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-400'}`}
                      onClick={() => setIsLeftPanelVisible(prev => !prev)}
                    >
                      <Layout className="w-3 h-3" />
                      Editor {isLeftPanelVisible ? 'ON' : 'OFF'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 gap-2 font-mono text-[10px] uppercase font-bold transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isRightPanelVisible ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-400'}`}
                      onClick={() => setIsRightPanelVisible(prev => !prev)}
                    >
                      <Layout className="w-3 h-3" />
                      Preview {isRightPanelVisible ? 'ON' : 'OFF'}
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                    {activeTab === 'resume' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {}}>
                            <Sparkles className="w-3 h-3 mr-1.5" />
                            Regenerate
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setHasUnsavedChanges(false)}>
                            <RotateCcw className="w-3 h-3 mr-1.5" />
                            Reset
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        
                         <PDFDownloadLink
                            document={<ResumePDF data={resumeData || {} as any} template={selectedTemplate} />}
                            fileName={`Resume-${resumeData?.personalInfo?.name || 'Tailored'}.pdf`}
                        >
                            {({ loading }) => (
                                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" disabled={loading}>
                                    {loading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Download className="w-3 h-3 mr-1.5" />}
                                    {loading ? 'Generating...' : 'Export PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                      </>
                    )}
                    {activeTab === 'cover-letter' && coverLetter && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRegenerateCoverLetter}>
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          Regenerate
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={handleSaveCoverLetter} disabled={isCoverLetterSaving}>
                          {isCoverLetterSaving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
                          {isCoverLetterSaving ? 'Saving...' : 'Save'}
                        </Button>
                        
                        <PDFDownloadLink
                          document={<CoverLetterPDF content={coverLetter} personalInfo={resumeData?.personalInfo} />}
                          fileName={`CoverLetter-${resumeData?.personalInfo?.name || 'Tailored'}.pdf`}
                        >
                          {({ loading }) => (
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" disabled={loading}>
                              {loading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Download className="w-3 h-3 mr-1.5" />}
                              {loading ? 'Generating...' : 'Export PDF'}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      </>
                    )}
                </div>
             </div>
          </div>


          {/* Content Grid */}
          <div className={`grid grid-cols-1 ${isLeftPanelVisible && isRightPanelVisible ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} bg-black gap-[2px] flex-1 min-h-0`}>
             {/* Left Panel: Editor */}
             <div className={`${!isLeftPanelVisible ? 'hidden' : 'flex'} bg-[#F0F0E8] flex-col min-h-0 relative group`}>
                 <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/90 hover:bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-0"
                      onClick={() => setIsLeftPanelVisible(false)}
                      title="Collapse Editor"
                    >
                      <PanelLeftClose className="w-4 h-4 text-slate-700" />
                    </Button>
                 </div>
                 <div className="px-6 md:px-8 pt-6 md:pt-8 shrink-0 bg-[#F0F0E8] border-b-2 border-black/10">
                     <RetroTabs 
                        tabs={[
                            { id: 'content', label: 'Resume Content' },
                            { id: 'job-description', label: 'Job Description' },
                            { id: 'cover-letter', label: 'Cover Letter' },
                        ]}
                        activeTab={activeEditorTab}
                        onTabChange={(id) => setActiveEditorTab(id as any)}
                     />
                 </div>
                 <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
                     <div className="max-w-4xl mx-auto space-y-6">
                        {activeEditorTab === 'content' && (
                            <ResumeForm resumeData={resumeData} onUpdate={onUpdate} />
                        )}
                        {activeEditorTab === 'job-description' && (
                            <JobDescriptionPanel 
                                jobDescription={jdText}
                                onJobDescriptionChange={setJdText}
                                selectedPrompt={selectedPrompt}
                                onPromptChange={setSelectedPrompt}
                                onGenerate={handleGenerateTailored}
                                isGenerating={isGenerating || status === 'PENDING' || status === 'PROCESSING'}
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
                     </div>
                 </div>
             </div>

             {/* Right Panel: Preview */}
             <div className={`${!isRightPanelVisible ? 'hidden' : 'flex'} bg-[#E5E5E0] flex-col min-h-0 relative group`}>
                 <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/90 hover:bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-0"
                      onClick={() => setIsRightPanelVisible(false)}
                      title="Collapse Preview"
                    >
                      <PanelRightClose className="w-4 h-4 text-slate-700" />
                    </Button>
                 </div>
                 <div className="px-6 md:px-8 pt-4 md:pt-5 shrink-0 bg-[#E5E5E0]">
                     <RetroTabs 
                        tabs={[
                            { id: 'resume', label: 'Resume' },
                            { id: 'cover-letter', label: 'Cover Letter' },
                            { id: 'jd-match', label: 'JD Match' },
                        ]}
                        activeTab={activeTab}
                        onTabChange={(id) => setActiveTab(id as TabId)}
                     />
                 </div>
                 <div className="flex-1 overflow-auto min-h-0 p-4 md:p-6 bg-gray-100">
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



          
         {/* Footer */}
        <div className="px-4 py-2 md:px-5 md:py-2.5 bg-[#F0F0E8] flex justify-between items-center font-mono text-xs text-slate-700 border-t border-black print:hidden z-50 relative shadow-md">
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
          <div className="flex items-center gap-3 flex-wrap justify-end">
             <div className="flex items-center gap-3 bg-white rounded-md px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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

             <div className="flex items-center gap-3 bg-white rounded-md px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                            {resumeData?.accentColor === c.value && <Check className="w-2.5 h-2.5 text-white" />}
                        </button>
                    ))}
                </div>
             </div>

             <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
             <span className="font-bold">A4</span>
          </div>
        </div>

      </div>
      {/* Global Loading Overlay */}
      {(isGenerating || isGeneratingCoverLetter || status === 'PENDING' || status === 'PROCESSING') && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                 <p className="font-mono font-bold text-lg blinking-cursor">
                    {isGeneratingCoverLetter ? 'GENERATING COVER LETTER...' : (status === 'PROCESSING' || status === 'PENDING' ? 'REFINING RESUME...' : 'STARTING REFINEMENT...')}
                 </p>
                 <p className="text-xs font-mono text-gray-500">This may take a moment</p>
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
