'use client'

import { useState, useRef } from 'react'
import {  Plus, Wand2, RotateCcw } from 'lucide-react'
import { trpc } from '@/trpc/client'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { ResumeExtraction,  Fixes, Fix } from './editor/types'
import { AddressSection } from './editor/AddressSection'
import { ProfileSection } from './editor/ProfileSection'
import { EducationSection } from './editor/EducationSection'
import { ExperienceSection } from './editor/ExperienceSection'
import { ProjectsSection } from './editor/ProjectsSection'
import { SkillsSection } from './editor/SkillsSection'
import { CertificationsSection } from './editor/CertificationsSection'
import { AwardsSection } from './editor/AwardsSection'
import { PublicationsSection } from './editor/PublicationsSection'
import { CustomSections } from './editor/CustomSections'
import { SaveChangesPopup } from './editor/SaveChangesPopup'
import { RemovableInput } from './editor/RemovableInput'
import {
  handleFieldChange as handleFieldChangeUtil,
  handleNestedFieldChange as handleNestedFieldChangeUtil,
  handleArrayAdd as handleArrayAddUtil,
  handleArrayDelete as handleArrayDeleteUtil,
  handleAddressChange as handleAddressChangeUtil,
  handleOtherLinksChange as handleOtherLinksChangeUtil,
  addNewOtherLink as addNewOtherLinkUtil,
  handleSkillArrayChange as handleSkillArrayChangeUtil,
  addSkill as addSkillUtil,
  removeSkill as removeSkillUtil,
  handleCustomFieldChange as handleCustomFieldChangeUtil,
  addCustomField as addCustomFieldUtil,
  removeCustomField as removeCustomFieldUtil,
} from '@/lib/utils'


import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function ResumeEditor({ fixes, extractedData, resumeId, isTailored }: { fixes: Fixes, extractedData: string | ResumeExtraction, resumeId: string, isTailored: boolean }) {
  const [save, setSave] = useState(false)
  const autoFixButtonRef = useRef<HTMLButtonElement>(null);

  // Auto Fix Shake Animation
  useGSAP(() => {
    if (autoFixButtonRef.current) {
      gsap.to(autoFixButtonRef.current, {
        rotate: 2,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: "power1.inOut",
        delay: 5, // Wait 5s before starting
        repeatDelay: 5, // Wait 5s between shakes
        onComplete: () => {
            // Reset to 0 just in case
           gsap.set(autoFixButtonRef.current, { rotate: 0 });
        }
      });
      // Actually repeat: -1 needs to be on the timeline or main tween.
      // Better approach for indefinite loop with delay:
      
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 5 });
      tl.to(autoFixButtonRef.current, { 
          rotation: 15, // More rotation
          x: 4, // Tighter but faster shake
          scale: 1.1, // Pulse size
          duration: 0.05, // Faster
          yoyo: true, 
          repeat: 9, // More shakes
          ease: "power1.inOut"
      })
      .to(autoFixButtonRef.current, { rotation: 0, x: 0, scale: 1, duration: 0.2 }); // Reset
    }
  }, { scope: autoFixButtonRef }); // Scope to self if possible or just run

  const [editorState, setEditorState] = useState<ResumeExtraction | null>(() => {
    if (!extractedData) return null;
    try {
      return typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData;
    } catch (error) {
      console.error("Failed to parse extractedData:", error);
      return null;
    }
  });

  const saveDataMutation = trpc.resume.saveData.useMutation({
    onSuccess: () => {
      toast.success("Resume changes saved successfully");
      setSave(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save changes");
    },
  });

  // History State for Undo
  const [history, setHistory] = useState<ResumeExtraction[]>([])

  const addToHistory = () => {
    if (editorState) {
      setHistory((prev) => [...prev.slice(-19), editorState]); // Keep last 20 states
    }
  }

  const undo = () => {
     setHistory((prev) => {
      const newHistory = [...prev];
      const lastState = newHistory.pop();
      if (lastState) {
        setEditorState(lastState);
        setSave(true);
      }
      return newHistory;
    });
  }

  const handleSave = () => {
    if (!editorState) return;
    
    saveDataMutation.mutate({
      resumeId,
      extractedData: editorState,
      isTailored,
    });
  };

  if (!editorState) {
    return <div>Error loading editor. The resume data might be corrupted.</div>
  }

  // ---------- Generic Updaters ----------
  const handleFieldChange = (section: keyof ResumeExtraction, value: unknown) => {
    handleFieldChangeUtil(section, value, setEditorState, setSave);
  }

  const handleNestedFieldChange = (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => {
    handleNestedFieldChangeUtil(section, index, key, value, setEditorState, setSave);
  }

  const handleArrayAdd = (section: keyof ResumeExtraction, newItem: unknown) => {
    handleArrayAddUtil(section, newItem, setEditorState, setSave);
  }

  const handleArrayDelete = (section: keyof ResumeExtraction, index: number) => {
    handleArrayDeleteUtil(section, index, setEditorState, setSave);
  }

  // ---------- Address Section Handlers ----------
  const handleAddressChange = (key: keyof NonNullable<ResumeExtraction['address']>, value: string) => {
    handleAddressChangeUtil(key, value, setEditorState, setSave);
  }

  const handleOtherLinksChange = (index: number, value: string) => {
    handleOtherLinksChangeUtil(index, value, setEditorState, setSave);
  }

  const addNewOtherLink = () => {
    addNewOtherLinkUtil(setEditorState, setSave);
  }

  // ---------- Skills Section Handlers ----------
  const handleSkillArrayChange = (type: keyof NonNullable<ResumeExtraction['skills']>, index: number, value: string) => {
    handleSkillArrayChangeUtil(type, index, value, setEditorState, setSave);
  };

  const addSkill = (type: keyof NonNullable<ResumeExtraction['skills']>) => {
    addSkillUtil(type, setEditorState, setSave);
  };

  const removeSkill = (type: keyof NonNullable<ResumeExtraction['skills']>, index: number) => {
    removeSkillUtil(type, index, setEditorState, setSave);
  };

  // ---------- Custom Fields Handlers ----------
  const handleCustomFieldChange = (
    section: keyof ResumeExtraction,
    index: number,
    fieldIndex: number,
    key: string,
    value: string
  ) => {
    handleCustomFieldChangeUtil(section, index, fieldIndex, key, value, setEditorState, setSave);
  };

  const addCustomField = (section: keyof ResumeExtraction, index: number) => {
    addCustomFieldUtil(section, index, setEditorState, setSave);
  };

  const removeCustomField = (section: keyof ResumeExtraction, index: number, fieldIndex: number) => {
    removeCustomFieldUtil(section, index, fieldIndex, setEditorState, setSave);
  };

  // ---------- Utility Renderer for simple array fields (kept here as it uses handleNestedFieldChange) ----------
  const renderStringArray = (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    values: string[] | undefined
  ) => {
    const safeValues = Array.isArray(values) ? values : [];

    return (
      <div className="flex flex-col gap-2">
        {safeValues.map((v, i) => (
          <RemovableInput
            key={i}
            value={v}
            placeholder={`${key} ${i + 1}`}
            onChange={(e) => {
              const updated = [...safeValues];
              updated[i] = e.target.value;
              handleNestedFieldChange(section, index, key, updated);
            }}
            onRemove={() => {
              const updated = [...safeValues];
              updated.splice(i, 1);
              handleNestedFieldChange(section, index, key, updated);
            }}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleNestedFieldChange(section, index, key, [
              ...(safeValues || []),
              '',
            ])
          }
          className="w-fit"
        >
          <Plus className="size-4 mr-2" /> Add {key}
        </Button>
      </div>
    );
  };

  // ---------- Auto Fix Logic ----------
  const applyAllFixes = () => {
    if (!editorState) return;
    
    let appliedCount = 0;
    const newEditorState = { ...editorState };
    
    if (!fixes) return;

    // Snapshot current state before applying fixes
    addToHistory(); 

    Object.keys(fixes).forEach((key) => {
      // "otherSections" in fixes maps to "customSections" in data
      const dataKey = key === 'otherSections' ? 'customSections' : (key as keyof ResumeExtraction);
      
      // We process only if explicit mapping handles it or it matches a key in ResumeExtraction
      // Note: primitive checking if it's a valid key is good practice
      
      const sectionFixes = fixes[key];
      // Check if it's an array of Fix objects
      if (Array.isArray(sectionFixes)) {
         const autoFix = sectionFixes.find(f => f.autoFix)?.autoFix;
         if (autoFix) {
           // We cast to any because we trust the AI/Prompt to match the type structure 
           // and TypeScript runtime checks are complex here.
           (newEditorState as any)[dataKey] = autoFix;
           appliedCount++;
         }
      } else {
        // Handle Record<string, Fix[]> case? FixesDisplay handles it for customSections but
        // prompts says "otherSections" is the key.
        // If we strictly follow prompt update, otherSections is Fix[].
      }
    });

    if (appliedCount > 0) {
      setEditorState(newEditorState);
      setSave(true);
      toast.success(`Applied ${appliedCount} auto-fixes`);
    } else {
      toast.info("No auto-fixes available");
    }
  };

  // ---------- UI ----------
  return (
    <>
      <div className="p-4 space-y-10">
        <div className="flex items-center justify-between mt-5">
           <h1 className="text-3xl font-bold">Resume Editor</h1>
           <div className="flex items-center gap-2">
             <Button
               variant="outline"
               size="icon"
               onClick={undo}
               disabled={history.length === 0}
               title="Undo last auto-fix"
             >
               <RotateCcw className="size-4" />
             </Button>
             <Button 
               ref={autoFixButtonRef}
               variant="outline" 
               className="text-green-600 border-green-200 hover:bg-green-50"
               onClick={() => {
                 // Click Animation
                 if (autoFixButtonRef.current) {
                   gsap.to(autoFixButtonRef.current, {
                     scale: 0.9,
                     duration: 0.1,
                     yoyo: true,
                     repeat: 1
                   });
                 }
                 applyAllFixes();
               }}
             >
               <Wand2 className="size-4 mr-2" /> Auto Fix All
             </Button>
           </div>
        </div>
       

        {/* =============== ADDRESS =============== */}
        {editorState.address && (
          <AddressSection
            address={editorState.address}
            handleAddressChange={handleAddressChange}
            handleOtherLinksChange={handleOtherLinksChange}
            addNewOtherLink={addNewOtherLink}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('address', data); }}
          />
        )}

        {/* =============== PROFILE + OBJECTIVE =============== */}
        {(editorState.profile || editorState.objective) && (
          <ProfileSection
            profile={editorState.profile}
            objective={editorState.objective}
            handleFieldChange={handleFieldChange}
            fixes={fixes}
            onFixApply={(section, value) => { addToHistory(); handleFieldChange(section, value); }}
          />
        )}

        {/* =============== EDUCATION =============== */}
        {editorState.education && (
          <EducationSection
            education={editorState.education}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('education', data); }}
          />
        )}

        {/* =============== EXPERIENCE =============== */}
        {editorState.experience && (
          <ExperienceSection
            experience={editorState.experience}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            renderStringArray={renderStringArray}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('experience', data); }}
          />
        )}

        {/* =============== PROJECTS =============== */}
        {editorState.projects && (
          <ProjectsSection
            projects={editorState.projects}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            renderStringArray={renderStringArray}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('projects', data); }}
          />
        )}

        {/* =============== SKILLS =============== */}
        {editorState.skills && (
          <SkillsSection
            skills={editorState.skills}
            handleSkillArrayChange={handleSkillArrayChange}
            addSkill={addSkill}
            removeSkill={removeSkill}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('skills', data); }}
          />
        )}

        {/* =============== CERTIFICATIONS =============== */}
        {editorState.certifications && (
          <CertificationsSection
            certifications={editorState.certifications}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('certifications', data); }}
          />
        )}

        {/* =============== AWARDS =============== */}
        {editorState.awards && (
          <AwardsSection
            awards={editorState.awards}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('awards', data); }}
          />
        )}

        {/* =============== PUBLICATIONS =============== */}
        {editorState.publications && (
          <PublicationsSection
            publications={editorState.publications}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            handleCustomFieldChange={handleCustomFieldChange}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('publications', data); }}
          />
        )}

        {/* =============== CUSTOM SECTIONS =============== */}
        {editorState.customSections && (
          <CustomSections
            customSections={editorState.customSections}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            setEditorState={setEditorState}
            fixes={fixes}
            onUpdate={(data) => { addToHistory(); handleFieldChange('customSections', data); }}
          />
        )}
      </div>

      <SaveChangesPopup
        save={save}
        onSave={handleSave}
        onCancel={() => setSave(false)}
        isLoading={saveDataMutation.isPending}
      />
    </>
  )
}


