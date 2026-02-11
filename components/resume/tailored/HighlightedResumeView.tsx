'use client';

import { useMemo } from 'react';
import { type ResumeData } from '@/lib/types/resume';
import { segmentTextByKeywords } from '@/lib/utils/keyword-matcher';
import { FileUser, Briefcase, GraduationCap, FolderKanban, Wrench } from 'lucide-react';

interface HighlightedResumeViewProps {
  resumeData: ResumeData;
  keywords: Set<string>;
}

/**
 * Display resume content with matching keywords highlighted.
 * Shows all resume sections with visual highlighting of JD matches.
 */
export function HighlightedResumeView({ resumeData, keywords }: HighlightedResumeViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b-2 border-black bg-[#F0F0E8] shrink-0">
        <div className="flex items-center gap-2">
            <FileUser className="w-4 h-4 text-black" />
            <h3 className="font-mono text-sm font-bold uppercase text-black">
            Your Resume
            </h3>
        </div>
        <span className="text-[10px] font-mono uppercase text-gray-500 bg-white/50 px-2 py-0.5 border border-black/10">
          JD Match Highlights
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-white font-sans">
        {/* Summary */}
        {resumeData.summary && (
          <Section title="Professional Summary" icon={<FileUser className="w-4 h-4" />}>
            <HighlightedText text={resumeData.summary} keywords={keywords} />
          </Section>
        )}

        {/* Work Experience */}
        {resumeData.workExperience && resumeData.workExperience.length > 0 && (
          <Section title="Experience" icon={<Briefcase className="w-4 h-4" />}>
            {resumeData.workExperience.map((exp) => (
              <div key={exp.id} className="mb-4 last:mb-0">
                <div className="font-semibold text-gray-900 flex justify-between">
                  <span>
                    <HighlightedText text={exp.title || ''} keywords={keywords} />
                    {exp.company && (
                      <span className="text-gray-600 font-normal">
                        {' at '}
                        <HighlightedText text={exp.company} keywords={keywords} />
                      </span>
                    )}
                  </span>
                </div>
                {exp.startDate && <div className="text-xs text-gray-500 mb-1">{exp.startDate} - {exp.endDate}</div>}
                {exp.description && (
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                    {exp.description.map((bullet, i) => (
                      <li key={i} className="text-gray-700">
                        <HighlightedText text={bullet} keywords={keywords} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <Section
            title="Education"
            icon={<GraduationCap className="w-4 h-4" />}
          >
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="mb-3 last:mb-0">
                <div className="font-semibold text-gray-900">
                  <HighlightedText text={edu.degree || ''} keywords={keywords} />
                </div>
                {edu.institution && (
                  <div className="text-sm text-gray-600">
                    <HighlightedText text={edu.institution} keywords={keywords} />
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {resumeData.personalProjects && resumeData.personalProjects.length > 0 && (
          <Section
            title="Projects"
            icon={<FolderKanban className="w-4 h-4" />}
          >
            {resumeData.personalProjects.map((proj) => (
              <div key={proj.id} className="mb-4 last:mb-0">
                <div className="font-semibold text-gray-900">
                  <HighlightedText text={proj.name || ''} keywords={keywords} />
                  {proj.role && (
                    <span className="text-gray-600 font-normal">
                      {' | '}
                      <HighlightedText text={proj.role} keywords={keywords} />
                    </span>
                  )}
                </div>
                {proj.description && (
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                    {proj.description.map((bullet, i) => (
                      <li key={i} className="text-gray-700">
                        <HighlightedText text={bullet} keywords={keywords} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Skills */}
        {resumeData.additional && (
          <Section title="Skills" icon={<Wrench className="w-4 h-4" />}>
            {resumeData.additional.technicalSkills &&
              resumeData.additional.technicalSkills.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-mono uppercase text-gray-500 mb-1">
                    Technical Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {resumeData.additional.technicalSkills.map((skill, i) => (
                      <SkillTag key={i} text={skill} keywords={keywords} />
                    ))}
                  </div>
                </div>
              )}

            {resumeData.additional.languages && resumeData.additional.languages.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-mono uppercase text-gray-500 mb-1">
                  Languages
                </div>
                <div className="flex flex-wrap gap-1">
                  {resumeData.additional.languages.map((lang, i) => (
                    <SkillTag key={i} text={lang} keywords={keywords} />
                  ))}
                </div>
              </div>
            )}

            {resumeData.additional.certificationsTraining &&
              resumeData.additional.certificationsTraining.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-mono uppercase text-gray-500 mb-1">
                    Certifications
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {resumeData.additional.certificationsTraining.map((cert, i) => (
                      <li key={i} className="text-gray-700">
                        <HighlightedText text={cert} keywords={keywords} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </Section>
        )}
      </div>
    </div>
  );
}

/**
 * Section wrapper component
 */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black bg-gray-50">
        {icon}
        <span className="font-mono text-xs font-bold uppercase text-black">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Component to render text with highlighted keywords.
 */
function HighlightedText({ text, keywords }: { text: string; keywords: Set<string> }) {
  const segments = useMemo(() => segmentTextByKeywords(text, keywords), [text, keywords]);

  return (
    <span>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded-none border-b-2 border-yellow-500 mx-[1px]">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </span>
  );
}

/**
 * Skill tag with optional highlighting
 */
function SkillTag({ text, keywords }: { text: string; keywords: Set<string> }) {
  const isMatch = keywords.has(text.toLowerCase());

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-mono border border-black ${
        isMatch 
        ? 'bg-yellow-300 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
        : 'bg-white text-gray-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
      }`}
    >
      {text}
    </span>
  );
}
