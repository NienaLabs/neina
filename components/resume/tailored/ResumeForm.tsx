'use client';

import React, { useState } from 'react';
import dragula from 'dragula';

import { ResumeData, SectionMeta, DEFAULT_SECTION_META } from '@/lib/types/resume';
import { DraggableSectionWrapper } from './DraggableSectionWrapper';
import { PersonalInfoForm } from './forms/PersonalInfoForm'; 
import { SummaryForm } from './forms/SummaryForm';
import { ExperienceForm } from './forms/ExperienceForm';
import { EducationForm } from './forms/EducationForm';
import { ProjectsForm } from './forms/ProjectsForm';
import { SkillsForm } from './forms/SkillsForm';
import { CustomSectionForm } from './forms/CustomSectionForm';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ResumeFormProps {
  resumeData: ResumeData | null;
  onUpdate: (data: ResumeData) => void;
  resumeId: string;
  onRegenerateStart?: (type: string) => void;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ resumeData: inputResumeData, onUpdate, resumeId, onRegenerateStart }) => {
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);



  // Merge extracted custom sections into sectionMeta if they exist but aren't in meta yet
  const rawMeta = inputResumeData?.sectionMeta || DEFAULT_SECTION_META;
  const customSectionKeys = Object.keys(inputResumeData?.customSections || {});
  
  const missingKeys = customSectionKeys.filter(key => !rawMeta.find(s => s.key === key));
  
  const sectionMeta = React.useMemo(() => {
     if (missingKeys.length === 0) return rawMeta;
     
     const newSections: SectionMeta[] = missingKeys.map((key, index) => {
         const sectionData = inputResumeData?.customSections?.[key];
         return {
             id: key,
             key: key,
             displayName: sectionData?.displayName || key.replace(/_/g, ' '),
             isVisible: true,
             isDefault: false,
             sectionType: sectionData?.sectionType || 'itemList',
             order: rawMeta.length + index
         };
     });
     
     return [...rawMeta, ...newSections];
  }, [rawMeta, missingKeys.join(','), inputResumeData?.customSections]);

  // Refs for stable access inside Dragula event handlers (avoids stale closures)
  const sectionMetaRef = React.useRef(sectionMeta);
  sectionMetaRef.current = sectionMeta;
  const inputResumeDataRef = React.useRef(inputResumeData);
  inputResumeDataRef.current = inputResumeData;
  const onUpdateRef = React.useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Dragula Effect — initialized once, uses refs for stable access to latest state
  React.useEffect(() => {
    if (!containerRef.current) return;

    const drake = dragula([containerRef.current], {
      moves: (_el, _container, handle) => {
        return !!handle?.closest('.drag-handle');
      },
    });

    drake.on('drop', () => {
      if (!containerRef.current) return;
      
      const newOrderIds = Array.from(containerRef.current.children)
        .map((child) => (child as HTMLElement).dataset.id)
        .filter(Boolean) as string[];

      const currentMeta = sectionMetaRef.current;

      // Reorder sectionMeta based on the new DOM order
      const newMeta = [...currentMeta].sort((a, b) => {
        const indexA = newOrderIds.indexOf(a.id);
        const indexB = newOrderIds.indexOf(b.id);
        if (indexA === -1) return 1; 
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      const updatedMeta = newMeta.map((s, idx) => ({ ...s, order: idx }));
      
      onUpdateRef.current({
           ...inputResumeDataRef.current!,
           sectionMeta: updatedMeta
      });
    });

    return () => {
      drake.destroy();
    };
  }, []); // Run once on mount — refs provide access to latest state

  if (!inputResumeData) return <div>Loading data...</div>;


  const handleAddSection = () => {
      const name = newSectionName.trim();
      if (!name) return;

      const key = name.toLowerCase().replace(/\s+/g, '_');
      
      // Check if already exists
      if (inputResumeData.customSections?.[key] || sectionMeta.find(s => s.key === key)) {
          toast.error("Section already exists");
          return;
      }

      const newCustomSection = {
          sectionType: 'itemList' as const,
          displayName: name,
          items: []
      };

      const newCustomSections = {
          ...inputResumeData.customSections,
          [key]: newCustomSection
      };

      onUpdate({
          ...inputResumeData,
          customSections: newCustomSections
      });

      setNewSectionName('');
      setIsAddSectionOpen(false);
      toast.success("Section added");
  };

  const renderSection = (section: SectionMeta) => {
    switch (section.key) {
        case 'personalInfo':
           return <PersonalInfoForm 
                    data={inputResumeData.personalInfo || {}} 
                    onChange={(val) => onUpdate({...inputResumeData, personalInfo: val})} 
                  />;
        case 'summary':
            return <SummaryForm 
                    value={inputResumeData.summary || ''} 
                    onChange={(val) => onUpdate({...inputResumeData, summary: val})} 
                   />;
        case 'workExperience':
            return <ExperienceForm 
                    data={inputResumeData.workExperience || []} 
                    onChange={(val) => onUpdate({...inputResumeData, workExperience: val})} 
                    resumeId={resumeId}
                    onRegenerateStart={onRegenerateStart}
                   />;
        case 'education':
            return <EducationForm 
                    data={inputResumeData.education || []} 
                    onChange={(val) => onUpdate({...inputResumeData, education: val})} 
                   />;
        case 'personalProjects':
            return <ProjectsForm 
                    data={inputResumeData.personalProjects || []} 
                    onChange={(val) => onUpdate({...inputResumeData, personalProjects: val})} 
                   />;
        case 'additional':
            return <SkillsForm 
                    data={inputResumeData.additional || { technicalSkills: [], languages: [], certificationsTraining: [], awards: [] }} 
                    onChange={(val) => onUpdate({...inputResumeData, additional: val})} 
                    resumeId={resumeId}
                    onRegenerateStart={onRegenerateStart}
                   />;
        default:
             const customKey = section.key;
             const customData = inputResumeData.customSections?.[customKey];
             
             if (customData) {
                 return (
                     <CustomSectionForm 
                         sectionKey={customKey}
                         sectionTitle={section.displayName}
                         data={customData}
                         updateData={(key, data) => {
                            const newCustomSections = { ...inputResumeData.customSections, [key]: data };
                            onUpdate({ ...inputResumeData, customSections: newCustomSections });
                         }}
                     />
                 );
             }

             return (
                <div className="border border-gray-200 p-4 rounded bg-white">
                    <h3 className="font-bold text-lg mb-2">{section.displayName}</h3>
                    <p className="text-gray-400 italic">Custom Section (Not implemented yet)</p>
                </div>
            );
    }
  };

  return (
    <>
        <div className="space-y-6 pb-20" ref={containerRef}>
          {sectionMeta
          .sort((a,b) => a.order - b.order)
          .map((section) => (
            <DraggableSectionWrapper key={section.id} id={section.id} disabled={section.id === 'personalInfo'}>
              {renderSection(section)}
            </DraggableSectionWrapper>
          ))}
        </div>

           {/* Add Section Button */}
          <div className="flex justify-center pt-4 pb-20">
            <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-2 w-full py-8 text-gray-500 hover:text-black hover:border-black hover:bg-gray-50">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Custom Section
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-name">Section Name</Label>
                    <Input 
                      id="section-name" 
                      placeholder="e.g. Volunteering, Publications, References" 
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddSection();
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSectionOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSection} disabled={!newSectionName.trim()}>Add Section</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
    </>
  );
};

