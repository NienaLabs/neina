'use client'

import { useState } from 'react'
import {  Plus, Blinds } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ResumeExtraction,  Fixes } from './editor/types'
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
} from '@/lib/utils'


export default function ResumeEditor({ fixes, extractedData }: { fixes: Fixes, extractedData: string | ResumeExtraction }) {
  const [save, setSave] = useState(false)
  const [editorState, setEditorState] = useState<ResumeExtraction | null>(() => {
    if (!extractedData) return null;
    try {
      return typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData;
    } catch (error) {
      console.error("Failed to parse extractedData:", error);
      return null;
    }
  });

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
          <Input
            key={i}
            value={v}
            placeholder={`${key} ${i + 1}`}
            onChange={(e) => {
              const updated = [...safeValues];
              updated[i] = e.target.value;
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

  // ---------- UI ----------
  return (
    <>
      <div className="p-4 space-y-10">
        <h1 className="text-3xl font-bold mt-5">Resume Editor</h1>
        <Button variant="ghost" className=' transition-all z-10 bottom-8 fixed right-10'>
          <Blinds className="size-13 hover:size-14 transition-all" />
        </Button>

        {/* =============== ADDRESS =============== */}
        {editorState.address && (
          <AddressSection
            address={editorState.address}
            handleAddressChange={handleAddressChange}
            handleOtherLinksChange={handleOtherLinksChange}
            addNewOtherLink={addNewOtherLink}
            fixes={fixes}
          />
        )}

        {/* =============== PROFILE + OBJECTIVE =============== */}
        {(editorState.profile || editorState.objective) && (
          <ProfileSection
            profile={editorState.profile}
            objective={editorState.objective}
            handleFieldChange={handleFieldChange}
            fixes={fixes}
          />
        )}

        {/* =============== EDUCATION =============== */}
        {editorState.education && (
          <EducationSection
            education={editorState.education}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            fixes={fixes}
          />
        )}

        {/* =============== EXPERIENCE =============== */}
        {editorState.experience && (
          <ExperienceSection
            experience={editorState.experience}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            renderStringArray={renderStringArray}
            fixes={fixes}
          />
        )}

        {/* =============== PROJECTS =============== */}
        {editorState.projects && (
          <ProjectsSection
            projects={editorState.projects}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            renderStringArray={renderStringArray}
            fixes={fixes}
          />
        )}

        {/* =============== SKILLS =============== */}
        {editorState.skills && (
          <SkillsSection
            skills={editorState.skills}
            handleSkillArrayChange={handleSkillArrayChange}
            addSkill={addSkill}
            fixes={fixes}
          />
        )}

        {/* =============== CERTIFICATIONS =============== */}
        {editorState.certifications && (
          <CertificationsSection
            certifications={editorState.certifications}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            fixes={fixes}
          />
        )}

        {/* =============== AWARDS =============== */}
        {editorState.awards && (
          <AwardsSection
            awards={editorState.awards}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            fixes={fixes}
          />
        )}

        {/* =============== PUBLICATIONS =============== */}
        {editorState.publications && (
          <PublicationsSection
            publications={editorState.publications}
            handleArrayAdd={handleArrayAdd}
            handleArrayDelete={handleArrayDelete}
            handleNestedFieldChange={handleNestedFieldChange}
            fixes={fixes}
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
          />
        )}
      </div>

      <SaveChangesPopup
        save={save}
        onSave={() => { /* Implement save logic here */ setSave(false) }}
        onCancel={() => setSave(false)}
      />
    </>
  )
}


