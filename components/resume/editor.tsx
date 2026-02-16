import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import {  Plus, Wand2, RotateCcw } from 'lucide-react'
import { trpc } from '@/trpc/client'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { ResumeExtraction,  Fixes, Fix } from './editor/types'
import { TemplateType } from '@/lib/types/resume'
import { DraggableSectionWrapper } from './tailored/DraggableSectionWrapper'
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

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';


import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface ResumeEditorProps {
    fixes: Fixes;
    extractedData: string | ResumeExtraction;
    resumeId: string;
    isTailored: boolean;
    onStateChange?: (data: ResumeExtraction) => void;
    template?: TemplateType;
    onHistoryChange?: (canUndo: boolean) => void;
}

export interface ResumeEditorRef {
    undo: () => void;
    applyAllFixes: () => void;
}

const ResumeEditor = forwardRef<ResumeEditorRef, ResumeEditorProps>(({ fixes, extractedData, resumeId, isTailored, onStateChange, template, onHistoryChange }, ref) => {
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
    let initialData = null;
    try {
        initialData = typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData;
    } catch (error) {
      console.error("Failed to parse extractedData:", error);
      return null;
    }
    
    // Inject template if provided and not present
    if (initialData && template && !initialData.template) {
        initialData = { ...initialData, template };
    }

    // Initialize sectionMeta if missing
    if (initialData && !initialData.sectionMeta) {
        const defaultOrder = [
            { id: 'address', key: 'address', displayName: 'Address', order: 0 },
            { id: 'profile', key: 'profile', displayName: 'Profile', order: 1 },
            { id: 'education', key: 'education', displayName: 'Education', order: 2 },
            { id: 'experience', key: 'experience', displayName: 'Experience', order: 3 },
            { id: 'skills', key: 'skills', displayName: 'Skills', order: 4 },
            { id: 'projects', key: 'projects', displayName: 'Projects', order: 5 },
            { id: 'certifications', key: 'certifications', displayName: 'Certifications', order: 6 },
            { id: 'awards', key: 'awards', displayName: 'Awards', order: 7 },
            { id: 'publications', key: 'publications', displayName: 'Publications', order: 8 },
            { id: 'customSections', key: 'customSections', displayName: 'Custom Sections', order: 9 },
        ];
        initialData = { ...initialData, sectionMeta: defaultOrder };
    }

    return initialData;
  });

  // Sync state changes to parent
  useEffect(() => {
      if (editorState && onStateChange) {
          onStateChange(editorState);
      }
  }, [editorState, onStateChange]);

  // Sync template prop changes
  useEffect(() => {
      if (template && editorState && editorState.template !== template) {
          setEditorState(prev => prev ? ({ ...prev, template }) : prev);
      }
  }, [template]);

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
  const lastHistoryTime = useRef(0)

  const addToHistory = (immediate = false) => {
    if (editorState) {
        const now = Date.now();
        // Save if immediate (structural change) or if enough time passed (new edit session)
        if (immediate || (now - lastHistoryTime.current > 1000)) {
            setHistory((prev) => [...prev.slice(-49), editorState]); // Keep last 50 states
            lastHistoryTime.current = now;
        }
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

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
      undo,
      applyAllFixes
  }));

  // Notify parent about history change
  useEffect(() => {
    onHistoryChange?.(history.length > 0);
  }, [history.length, onHistoryChange]);

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
    addToHistory(false);
    handleFieldChangeUtil(section, value, setEditorState, setSave);
  }

  const handleNestedFieldChange = (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => {
    addToHistory(false);
    handleNestedFieldChangeUtil(section, index, key, value, setEditorState, setSave);
  }

  const handleArrayAdd = (section: keyof ResumeExtraction, newItem: unknown) => {
    addToHistory(true);
    handleArrayAddUtil(section, newItem, setEditorState, setSave);
  }

  const handleArrayDelete = (section: keyof ResumeExtraction, index: number) => {
    addToHistory(true);
    handleArrayDeleteUtil(section, index, setEditorState, setSave);
  }

  // ---------- Address Section Handlers ----------
  const handlePersonalInfoChange = (key: keyof NonNullable<ResumeExtraction['personalInfo']>, value: string) => {
    addToHistory(false);
    setEditorState(prev => {
        if (!prev) return null;
        return {
            ...prev,
            personalInfo: {
                ...prev.personalInfo,
                [key]: value
            }
        };
    });
    setSave(true);
  }

  const handleAddressChange = (key: keyof NonNullable<ResumeExtraction['address']>, value: string) => {
    addToHistory(false);
    handleAddressChangeUtil(key, value, setEditorState, setSave);
  }

  const handleOtherLinksChange = (index: number, value: string) => {
    addToHistory(false);
    handleOtherLinksChangeUtil(index, value, setEditorState, setSave);
  }

  const addNewOtherLink = () => {
    addToHistory(true);
    addNewOtherLinkUtil(setEditorState, setSave);
  }

  // ---------- Skills Section Handlers ----------
  const handleSkillArrayChange = (type: keyof NonNullable<ResumeExtraction['skills']>, index: number, value: string) => {
    addToHistory(false);
    handleSkillArrayChangeUtil(type, index, value, setEditorState, setSave);
  };

  const addSkill = (type: keyof NonNullable<ResumeExtraction['skills']>) => {
    addToHistory(true);
    addSkillUtil(type, setEditorState, setSave);
  };

  const removeSkill = (type: keyof NonNullable<ResumeExtraction['skills']>, index: number) => {
    addToHistory(true);
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
    addToHistory(false);
    handleCustomFieldChangeUtil(section, index, fieldIndex, key, value, setEditorState, setSave);
  };

  const addCustomField = (section: keyof ResumeExtraction, index: number) => {
    addToHistory(true);
    addCustomFieldUtil(section, index, setEditorState, setSave);
  };

  const removeCustomField = (section: keyof ResumeExtraction, index: number, fieldIndex: number) => {
    addToHistory(true);
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
    addToHistory(true); 

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
           // Additional validation for customSections to ensure it's an array
           if (dataKey === 'customSections' && !Array.isArray(autoFix)) {
             console.warn(`Auto-fix for customSections is not an array, skipping:`, autoFix);
             return;
           }
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

  // ---------- Drag and Drop Handlers ----------
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track latest editorState in a ref to avoid stale closures in event handlers
  const editorStateRef = useRef(editorState);
  editorStateRef.current = editorState;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentState = editorStateRef.current;
    if (!currentState?.sectionMeta) return;

    const oldIndex = currentState.sectionMeta.findIndex((s) => s.id === active.id);
    const newIndex = currentState.sectionMeta.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Save current state to history before modifying
    setHistory((h) => [...h.slice(-49), currentState]);

    const newMeta = [...currentState.sectionMeta];
    const [moved] = newMeta.splice(oldIndex, 1);
    newMeta.splice(newIndex, 0, moved);

    const updatedMeta = newMeta.map((s, idx) => ({ ...s, order: idx }));
    
    const newState = {
      ...currentState,
      sectionMeta: updatedMeta,
    };

    setEditorState(newState);
    onStateChange?.(newState); // Sync to parent for Preview
    setSave(true);
  };

  /**
   * Checks whether a given section key has meaningful data in the editor state.
   * Sections without data are hidden to avoid showing empty cards with drag handles.
   * @param key - The section key from sectionMeta
   * @returns true if the section has no data and should be hidden
   */
  const isSectionEmpty = useCallback((key: string): boolean => {
    switch (key) {
      case 'address':
        return false; // Always show personal details
      case 'profile':
        return !editorState.profile;
      case 'education':
        return !editorState.education || !Array.isArray(editorState.education) || editorState.education.length === 0;
      case 'experience':
        return !editorState.experience || !Array.isArray(editorState.experience) || editorState.experience.length === 0;
      case 'projects':
        return !editorState.projects || !Array.isArray(editorState.projects) || editorState.projects.length === 0;
      case 'skills': {
        if (!editorState.skills) return true;
        if (Array.isArray(editorState.skills)) return editorState.skills.length === 0;
        // Record<string, string[]> — check if all arrays are empty
        return Object.values(editorState.skills).every(
          (arr) => !Array.isArray(arr) || arr.length === 0
        );
      }
      case 'certifications':
        return !editorState.certifications || !Array.isArray(editorState.certifications) || editorState.certifications.length === 0;
      case 'awards':
        return !editorState.awards || !Array.isArray(editorState.awards) || editorState.awards.length === 0;
      case 'publications':
        return !editorState.publications || !Array.isArray(editorState.publications) || editorState.publications.length === 0;
      case 'customSections':
        return !editorState.customSections || (Array.isArray(editorState.customSections) && editorState.customSections.length === 0);
      default:
        return false;
    }
  }, [editorState]);

  const renderSection = (key: string) => {
      switch (key) {
          case 'address':
              return (
                  <AddressSection
                    address={editorState.address || {}}
                    personalInfo={editorState.personalInfo || {}}
                    handleAddressChange={handleAddressChange}
                    handlePersonalInfoChange={handlePersonalInfoChange}
                    handleOtherLinksChange={handleOtherLinksChange}
                    addNewOtherLink={addNewOtherLink}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('address', data); }}
                  />
              );
          case 'profile':
              return (
                  <ProfileSection
                    profile={editorState.profile}
                    objective={editorState.objective}
                    handleFieldChange={handleFieldChange}
                    fixes={fixes}
                    onFixApply={(section, value) => { handleFieldChange(section, value); }}
                  />
              );
          case 'education':
              return (
                  <EducationSection
                    education={editorState.education || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    addCustomField={addCustomField}
                    removeCustomField={removeCustomField}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('education', data); }}
                  />
              );
          case 'experience':
              return (
                  <ExperienceSection
                    experience={editorState.experience || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    addCustomField={addCustomField}
                    removeCustomField={removeCustomField}
                    renderStringArray={renderStringArray}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('experience', data); }}
                  />
              );
          case 'projects':
              return (
                  <ProjectsSection
                    projects={editorState.projects || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    addCustomField={addCustomField}
                    removeCustomField={removeCustomField}
                    renderStringArray={renderStringArray}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('projects', data); }}
                  />
              );
          case 'skills':
              return (
                  <SkillsSection
                    skills={editorState.skills || {}}
                    handleSkillArrayChange={handleSkillArrayChange}
                    addSkill={addSkill}
                    removeSkill={removeSkill}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('skills', data); }}
                  />
              );
          case 'certifications':
              return (
                  <CertificationsSection
                    certifications={editorState.certifications || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    addCustomField={addCustomField}
                    removeCustomField={removeCustomField}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('certifications', data); }}
                  />
              );
          case 'awards':
              return (
                  <AwardsSection
                    awards={editorState.awards || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    addCustomField={addCustomField}
                    removeCustomField={removeCustomField}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('awards', data); }}
                  />
              );
          case 'publications':
              return (
                  <PublicationsSection
                    publications={editorState.publications || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    addCustomField={addCustomField}
                    removeCustomField={removeCustomField}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('publications', data); }}
                  />
              );
          case 'customSections':
              return (
                  <CustomSections
                    customSections={editorState.customSections || []}
                    handleArrayAdd={handleArrayAdd}
                    handleArrayDelete={handleArrayDelete}
                    handleNestedFieldChange={handleNestedFieldChange}
                    setEditorState={setEditorState}
                    fixes={fixes}
                    onUpdate={(data) => { handleFieldChange('customSections', data); }}
                  />
              );
          default:
              return null;
      }
  }



  // ---------- UI ----------
  return (
    <>
      <div className="p-4 pl-10 space-y-10">

       
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragEnd={handleDragEnd}
        >
            <SortableContext 
                items={editorState.sectionMeta?.filter(s => !isSectionEmpty(s.key)).map(s => s.id) || []} 
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-6">
                    {editorState.sectionMeta
                        ?.filter(section => !isSectionEmpty(section.key))
                        .map((section) => (
                        <DraggableSectionWrapper key={section.id} id={section.id} disabled={section.key === 'address'}>
                            {renderSection(section.key)}
                        </DraggableSectionWrapper>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
      </div>

      <SaveChangesPopup
        save={save}
        onSave={handleSave}
        onCancel={() => setSave(false)}
        isLoading={saveDataMutation.isPending}
        onUndo={undo}
        canUndo={history.length > 0}
      />
    </>
  )
});

ResumeEditor.displayName = 'ResumeEditor';
export default ResumeEditor;


