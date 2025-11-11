'use client'

import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { useState } from 'react'
import { CircleArrowRight, Plus, Trash2,Blinds, Info } from 'lucide-react'
import { extractionData } from '../../constants/constant'
import Hint from '../hint'
import { Badge } from '../ui/badge'

const ResumeEditor = ({fixes}) => {
  const [editorState, setEditorState] = useState<ResumeExtraction>(extractionData)

  // ---------- Generic Updaters ----------
  const handleFieldChange = (section: keyof ResumeExtraction, value: unknown) => {
    setEditorState((prev) => ({ ...prev, [section]: value }))
  }

  const handleNestedFieldChange = (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => {
    setEditorState((prev) => {
      const updated = [...(prev[section] as unknown[])]
      updated[index] = { ...updated[index] as unknown[], [key]: value }
      return { ...prev, [section]: updated }
    })
  }

  const handleArrayAdd = (section: keyof ResumeExtraction, newItem: unknown) => {
    setEditorState((prev) => ({
      ...prev,
      [section]: [...((prev[section] as unknown[]) || []), newItem],
    }))
  }

  const handleArrayDelete = (section: keyof ResumeExtraction, index: number) => {
    setEditorState((prev) => {
      const updated = [...(prev[section] as unknown[])]
      updated.splice(index, 1)
      return { ...prev, [section]: updated }
    })
  }

  // ---------- Address Section ----------
  const handleAddressChange = (key: keyof ResumeExtraction['address'], value: string) => {
    setEditorState((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }))
  }

const handleSkillArrayChange = (type: keyof ResumeExtraction['skills'], index: number, value: string) => {
  setEditorState((prev) => {
    const updatedSkills = { ...prev.skills };
    const arr = [...(updatedSkills[type] || [])];
    arr[index] = value;
    updatedSkills[type] = arr;
    return { ...prev, skills: updatedSkills };
  });
};

const addSkill = (type: keyof ResumeExtraction['skills']) => {
  setEditorState((prev) => {
    const updatedSkills = { ...prev.skills };
    updatedSkills[type] = [...(updatedSkills[type] || []), ''];
    return { ...prev, skills: updatedSkills };
  });
};


  const handleOtherLinksChange = (index: number, value: string) => {
    setEditorState((prev) => {
      const updatedLinks = [...(prev.address.otherLinks || [])]
      updatedLinks[index] = value
      return { ...prev, address: { ...prev.address, otherLinks: updatedLinks } }
    })
  }

  const addNewOtherLink = () => {
    setEditorState((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        otherLinks: [...(prev.address.otherLinks || []), ''],
      },
    }))
  }

 const handleFixes = (section: string) => {
  let issue = ""
  let suggestion = ""

  // Normal (non-custom) sections
  if (section !== "otherSections") {
    const sectionFixes = fixes[section] || []
    sectionFixes.forEach((fix) => {
      issue += `\n ${fix.severity}: ${fix.issue}`
      suggestion += `\n ${fix.suggestion}`
    })

    if (!sectionFixes.length) return null

    return (
      <Hint
        hint={
          <div className="space-y-2 max-w-md text-sm">
            <div>
              <Badge variant="destructive">Issues</Badge>
              <pre className="whitespace-pre-wrap">{issue}</pre>
            </div>
            <div>
              <Badge>Suggestions</Badge>
              <pre className="whitespace-pre-wrap">{suggestion}</pre>
            </div>
          </div>
        }
      >
        <Badge className="flex items-center gap-1">
          report <Info className="size-4" />
        </Badge>
      </Hint>
    )
  }

  // Custom Sections
  else if (section === "otherSections") {
    const customFixes = fixes.otherSections || {}

    if (Object.keys(customFixes).length === 0) return null

    return (
      <div className="flex flex-wrap gap-2">
        {Object.keys(customFixes).map((sectionName) => {
          const sectionIssues = customFixes[sectionName] || []
          let customIssue = ""
          let customSuggestion = ""

          sectionIssues.forEach((fix) => {
            customIssue += `\n ${fix.severity}: ${fix.issue}`
            customSuggestion += `\n ${fix.suggestion}`
          })

          return (
            <Hint
              key={sectionName}
              hint={
                <div className="space-y-2 max-w-md text-sm">
                  <div>
                    <Badge variant="outline" className="bg-gray-200 text-black">
                      {sectionName}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="destructive">Issues</Badge>
                    <pre className="whitespace-pre-wrap">{customIssue}</pre>
                  </div>
                  <div>
                    <Badge>Suggestions</Badge>
                    <pre className="whitespace-pre-wrap">{customSuggestion}</pre>
                  </div>
                </div>
              }
            >
              <Badge className="flex items-center gap-1">
                {sectionName} <Info className="size-4" />
              </Badge>
            </Hint>
          )
        })}
      </div>
    )
  }
}
 // ---------- Utility Renderer for simple array fields ----------
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
    <div className="p-4 space-y-10">
      <h1 className="text-3xl font-bold mt-5">Resume Editor</h1>
     
       <Button variant="ghost" className=' transition-all z-10 bottom-8 fixed right-10'>
         <Blinds  className="size-13 hover:size-14 transition-all"/>
       </Button>
      {/* =============== ADDRESS =============== */}
      {editorState.address && (
        <section>
        <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Address</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("address")}</div>
        </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.keys(editorState.address).map((key) => {
              if (key === 'otherLinks') {
                return (
                  <div key={key} className="col-span-3">
                    <p className="font-medium mb-1">Other Links</p>
                    <div className="flex flex-col gap-2">
                      {editorState.address.otherLinks?.map((link, i) => (
                        <Input
                          key={i}
                          value={link}
                          onChange={(e) => handleOtherLinksChange(i, e.target.value)}
                          placeholder={`Link ${i + 1}`}
                        />
                      ))}
                      <Button onClick={addNewOtherLink} variant="outline" size="sm" className="w-fit">
                        <Plus className="w-4 h-4 mr-2" /> Add Link
                      </Button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={key}>
                  <p className="font-medium mb-1 capitalize">{key}</p>
                  <Input
                    value={editorState.address[key as keyof ResumeExtraction['address']] || ''}
                    onChange={(e) =>
                      handleAddressChange(key as keyof ResumeExtraction['address'], e.target.value)
                    }
                    placeholder={key}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* =============== PROFILE + OBJECTIVE =============== */}
      {editorState.profile && (
        <section>
          <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Profile</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("profile")}</div>
        </div>
          <Textarea
            rows={4}
            value={editorState.profile}
            onChange={(e) => handleFieldChange('profile', e.target.value)}
          />
        </section>
      )}

      {editorState.objective && (
        <section>
          <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Objective</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("objective")}</div>
        </div>
          <Textarea
            rows={3}
            value={editorState.objective}
            onChange={(e) => handleFieldChange('objective', e.target.value)}
          />
        </section>
      )}

      {/* =============== EDUCATION =============== */}
      {editorState.education && (
        <section>
          <div className="text-xl font-semibold flex items-center justify-between">
            <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Education</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("education")}</div>
        </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleArrayAdd('education', {
                  institution: '',
                  degree: '',
                  fieldOfStudy: '',
                  startDate: '',
                  endDate: '',
                  grade: '',
                  location: '',
                  description: '',
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" /> Add Education
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {editorState.education.map((edu, index) => (
              <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => handleArrayDelete('education', index)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) =>
                      handleNestedFieldChange('education', index, 'institution', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) =>
                      handleNestedFieldChange('education', index, 'degree', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Field of Study"
                    value={edu.fieldOfStudy}
                    onChange={(e) =>
                      handleNestedFieldChange('education', index, 'fieldOfStudy', e.target.value)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="month"
                      value={edu.startDate}
                      onChange={(e) =>
                        handleNestedFieldChange('education', index, 'startDate', e.target.value)
                      }
                    />
                    <CircleArrowRight className="size-4" />
                    <Input
                      type="month"
                      value={edu.endDate}
                      onChange={(e) =>
                        handleNestedFieldChange('education', index, 'endDate', e.target.value)
                      }
                    />
                  </div>
                  <Input
                    placeholder="Grade"
                    value={edu.grade}
                    onChange={(e) =>
                      handleNestedFieldChange('education', index, 'grade', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Location"
                    value={edu.location}
                    onChange={(e) =>
                      handleNestedFieldChange('education', index, 'location', e.target.value)
                    }
                  />
                  <Textarea
                    placeholder="Description"
                    value={edu.description}
                    onChange={(e) =>
                      handleNestedFieldChange('education', index, 'description', e.target.value)
                    }
                    className="col-span-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =============== EXPERIENCE =============== */}
      {editorState.experience && (
        <section>
          <div className="text-xl font-semibold  flex items-center justify-between">
           <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Experience</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("experience")}</div>
        </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleArrayAdd('experience', {
                  position: '',
                  company: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  responsibilities: [''],
                  achievements: [''],
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {editorState.experience.map((exp, index) => (
              <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => handleArrayDelete('experience', index)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Position"
                    value={exp.position}
                    onChange={(e) =>
                      handleNestedFieldChange('experience', index, 'position', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) =>
                      handleNestedFieldChange('experience', index, 'company', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) =>
                      handleNestedFieldChange('experience', index, 'location', e.target.value)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) =>
                        handleNestedFieldChange('experience', index, 'startDate', e.target.value)
                      }
                    />
                    <CircleArrowRight className="size-4" />
                    <Input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) =>
                        handleNestedFieldChange('experience', index, 'endDate', e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium">Responsibilities</p>
                    {renderStringArray('experience', index, 'responsibilities', exp.responsibilities)}
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium">Achievements</p>
                    {renderStringArray('experience', index, 'achievements', exp.achievements)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    {/* =============== PROJECTS =============== */}
{editorState.projects && (
  <section>
    <div className="text-xl font-semibold  flex items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Projects</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("projects")}</div>
        </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          handleArrayAdd('projects', {
            name: '',
            description: '',
            technologies: [''],
            role: '',
            link: '',
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Project
      </Button>
    </div>

    <div className="flex flex-col gap-6">
      {editorState.projects.map((proj, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => handleArrayDelete('projects', index)}
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Project Name"
              value={proj.name}
              onChange={(e) => handleNestedFieldChange('projects', index, 'name', e.target.value)}
            />
            <Input
              placeholder="Role"
              value={proj.role}
              onChange={(e) => handleNestedFieldChange('projects', index, 'role', e.target.value)}
            />
            <Textarea
              className="col-span-2"
              placeholder="Description"
              value={proj.description}
              onChange={(e) =>
                handleNestedFieldChange('projects', index, 'description', e.target.value)
              }
            />
            <div className="col-span-2">
              <p className="font-medium">Technologies</p>
              {renderStringArray('projects', index, 'technologies', proj.technologies)}
            </div>
            <Input
              className="col-span-2"
              placeholder="Project Link"
              value={proj.link}
              onChange={(e) => handleNestedFieldChange('projects', index, 'link', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  </section>
)}

{/* =============== SKILLS =============== */}
{editorState.skills && (
  <section>
    <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Skills</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("skills")}</div>
        </div>
    {Object.entries(editorState.skills).map(([type, skills]) => (
      <div key={type} className="mb-4">
        <p className="font-medium capitalize">{type} Skills</p>
        <div className="flex flex-col gap-2">
          {skills.map((skill, i) => (
            <Input
              key={i}
              value={skill}
              onChange={(e) => handleSkillArrayChange(type as keyof ResumeExtraction['skills'], i, e.target.value)}
              placeholder={`${type} skill ${i + 1}`}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => addSkill(type as keyof ResumeExtraction['skills'])}
          >
            <Plus className="size-4 mr-2" /> Add {type} skill
          </Button>
        </div>
      </div>
    ))}
  </section>
)}

{/* =============== CERTIFICATIONS =============== */}
{editorState.certifications && (
  <section>
    <div className="text-xl font-semibold  flex items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Certifications</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("certifcations")}</div>
        </div><Button
        variant="outline"
        size="sm"
        onClick={() =>
          handleArrayAdd('certifications', {
            name: '',
            issuer: '',
            year: '',
            description: '',
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Certification
      </Button>
    </div>

    <div className="flex flex-col gap-6">
      {editorState.certifications.map((cert, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => handleArrayDelete('certifications', index)}
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Certification Name"
              value={cert.name}
              onChange={(e) =>
                handleNestedFieldChange('certifications', index, 'name', e.target.value)
              }
            />
            <Input
              placeholder="Issuer"
              value={cert.issuer}
              onChange={(e) =>
                handleNestedFieldChange('certifications', index, 'issuer', e.target.value)
              }
            />
            <Input
              placeholder="Year"
              value={cert.year}
              onChange={(e) =>
                handleNestedFieldChange('certifications', index, 'year', e.target.value)
              }
            />
            <Textarea
              placeholder="Description"
              className="col-span-2"
              value={cert.description}
              onChange={(e) =>
                handleNestedFieldChange('certifications', index, 'description', e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  </section>
)}

{/* =============== AWARDS =============== */}
{editorState.awards && (
  <section>
    <div className="text-xl font-semibold mb-3 flex items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Awards</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("awards")}</div>
        </div>      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          handleArrayAdd('awards', {
            title: '',
            issuer: '',
            year: '',
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Award
      </Button>
    </div>

    <div className="flex flex-col gap-6">
      {editorState.awards.map((award, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => handleArrayDelete('awards', index)}
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Title"
              value={award.title}
              onChange={(e) =>
                handleNestedFieldChange('awards', index, 'title', e.target.value)
              }
            />
            <Input
              placeholder="Issuer"
              value={award.issuer}
              onChange={(e) =>
                handleNestedFieldChange('awards', index, 'issuer', e.target.value)
              }
            />
            <Input
              placeholder="Year"
              value={award.year}
              onChange={(e) =>
                handleNestedFieldChange('awards', index, 'year', e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  </section>
)}

{/* =============== PUBLICATIONS =============== */}
{editorState.publications && (
  <section>
    <div className="text-xl font-semibold mb-3 flex items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Publications</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("publications")}</div>
        </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          handleArrayAdd('publications', {
            title: '',
            publisher: '',
            date: '',
            link: '',
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Publication
      </Button>
    </div>

    <div className="flex flex-col gap-6">
      {editorState.publications.map((pub, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => handleArrayDelete('publications', index)}
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Title"
              value={pub.title}
              onChange={(e) =>
                handleNestedFieldChange('publications', index, 'title', e.target.value)
              }
            />
            <Input
              placeholder="Publisher"
              value={pub.publisher}
              onChange={(e) =>
                handleNestedFieldChange('publications', index, 'publisher', e.target.value)
              }
            />
            <Input
              placeholder="Date"
              value={pub.date}
              onChange={(e) =>
                handleNestedFieldChange('publications', index, 'date', e.target.value)
              }
            />
            <Input
              placeholder="Link"
              value={pub.link}
              onChange={(e) =>
                handleNestedFieldChange('publications', index, 'link', e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  </section>
)}

{/* =============== CUSTOM SECTIONS =============== */}
{editorState.customSections && (
  <section>
    <div className="text-xl font-semibold mb-3 flex items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
           <h2 className="text-xl font-semibold mb-3">Other Sections</h2>
          <div className="p-1 mb-3 flex items-center justify-center">{handleFixes("otherSections")}</div>
        </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          handleArrayAdd('customSections', { sectionName: 'New Section', entries: [] })
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Custom Section
      </Button>
    </div>

    <div className="flex flex-col gap-6">
      {editorState.customSections.map((section, secIndex) => (
        <div key={secIndex} className="p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <Input
              className="font-bold text-lg"
              value={section.sectionName}
              onChange={(e) =>
                handleNestedFieldChange('customSections', secIndex, 'sectionName', e.target.value)
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleArrayDelete('customSections', secIndex)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>
          </div>

          {section.entries.map((entry, entryIndex) => (
            <div key={entryIndex} className="border rounded p-3 mb-3 bg-white relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1"
                onClick={() => {
                  const updated = [...section.entries]
                  updated.splice(entryIndex, 1)
                  const updatedSections = [...editorState.customSections]
                  updatedSections[secIndex] = {
                    ...section,
                    entries: updated,
                  }
                  setEditorState((prev) => ({ ...prev, customSections: updatedSections }))
                }}
              >
                <Trash2 className="size-4 text-red-500" />
              </Button>

              {Object.keys(entry).map((key) => (
                <div key={key} className="mt-2">
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <Input
                    value={entry[key] || ''}
                    placeholder={key}
                    onChange={(e) => {
                      const updatedEntries = [...section.entries]
                      updatedEntries[entryIndex] = {
                        ...updatedEntries[entryIndex],
                        [key]: e.target.value,
                      }
                      handleNestedFieldChange('customSections', secIndex, 'entries', updatedEntries)
                    }}
                  />
                </div>
              ))}
            </div>
          ))}

      <Button
  variant="outline"
  size="sm"
  onClick={() => {
    const newEntry =
      section.entries.length > 0
        ? Object.fromEntries(
            Object.keys(section.entries[0]).map((key) => [key, ''])
          )
        : { title: '', description: '' }; // Default shape for the very first entry

    const updated = [...section.entries, newEntry];
    handleNestedFieldChange('customSections', secIndex, 'entries', updated);
  }}
>
  <Plus className="w-4 h-4 mr-2" /> Add Entry
</Button>
  </div>
      ))}
    </div>
  </section>
)}

    </div>
  )
}

export default ResumeEditor
