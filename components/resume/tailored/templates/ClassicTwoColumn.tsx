'use client';

import React from 'react';
import { ResumeData } from '@/lib/types/resume';
import { ResumePreviewItem } from './ClassicSingle';

export const generateClassicTwoColumnItems = (data: ResumeData): ResumePreviewItem[] => {
  const list: ResumePreviewItem[] = [];
  const { summary, workExperience, personalProjects, customSections, sectionMeta } = data;

  // Main Column sections: Summary, Experience, Projects, Custom
  const sortedSections = (sectionMeta || [])
    .filter(s => s.isVisible && s.id !== 'personalInfo' && !['additional', 'education'].includes(s.key))
    .sort((a, b) => a.order - b.order);

  const defaultMainOrder = ['summary', 'workExperience', 'personalProjects'];
  const mainSectionsToRender = sortedSections.length > 0 
    ? sortedSections.map(s => s.key) 
    : [...defaultMainOrder, ...(customSections ? Object.keys(customSections) : [])];

  mainSectionsToRender.forEach(key => {
    switch(key) {
      case 'summary':
        if (summary) {
          list.push({ id: 'summary-title', type: 'section-title', content: { title: 'Summary' } });
          list.push({ id: 'summary-content', type: 'summary-content', content: summary });
        }
        break;
      
      case 'workExperience':
        if (workExperience && workExperience.length > 0) {
          list.push({ id: 'exp-title', type: 'section-title', content: { title: 'Work Experience' } });
          workExperience.forEach((exp, idx) => {
            list.push({ id: `exp-${exp.id || idx}-${idx}`, type: 'experience-item', content: exp });
          });
        }
        break;

      case 'personalProjects':
        if (personalProjects && personalProjects.length > 0) {
          list.push({ id: 'proj-title', type: 'section-title', content: { title: 'Key Projects' } });
          personalProjects.forEach((proj, idx) => {
            list.push({ id: `proj-${proj.id || idx}-${idx}`, type: 'project-item', content: proj });
          });
        }
        break;

      default:
        const customData = customSections?.[key];
        if (customData) {
          list.push({ id: `custom-${key}-title`, type: 'section-title', content: { title: customData.displayName || key.replace(/-/g, ' ') } });
          if (customData.sectionType === 'text' && customData.text) {
             list.push({ id: `custom-${key}-text`, type: 'summary-content', content: customData.text });
          } else if (customData.items && Array.isArray(customData.items)) {
            customData.items.forEach((item, idx) => {
              list.push({ id: `custom-${key}-${idx}`, type: 'custom-item', content: item });
            });
          } else if (customData.sectionType === 'stringList' && customData.strings) {
            list.push({ id: `custom-${key}-strings`, type: 'string-list', content: customData.strings });
          }
        }
    }
  });

  return list;
};

export const ClassicTwoColumnRenderer: React.FC<{ item: ResumePreviewItem; accentColor?: string }> = ({ item, accentColor = '#2563eb' }) => {
  // Logic is same as ClassicSingle but with slightly smaller fonts/spacing for 2-col
  const { type, content } = item;

  switch (type) {
    case 'section-title':
      return (
        <div className="mb-2 mt-4">
          <h3 className="uppercase tracking-widest text-[11px] font-bold text-gray-900 pb-0.5 font-serif border-b-2" style={{ borderColor: accentColor }}>
            {content.title}
          </h3>
        </div>
      );

    case 'summary-content':
      return (
        <p className="text-[12px] text-gray-800 leading-snug text-justify mb-3 font-serif">
          {content}
        </p>
      );

    case 'experience-item':
      return (
        <div className="mb-3 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-bold text-gray-900 text-[12px]">{content.title}</h4>
            <span className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">
              {content.startDate} – {content.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-gray-800 italic">{content.company}</span>
            <span className="text-[10px] text-gray-600">{content.location}</span>
          </div>
          <ul className="list-disc leading-tight ml-4 space-y-0.5">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-[11px] text-gray-800 pl-1">{desc}</li>
            ))}
          </ul>
        </div>
      );

    case 'project-item':
      return (
        <div className="mb-3 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-bold text-gray-900 text-[12px]">{content.name}</h4>
            <span className="text-[10px] font-semibold text-gray-700">
              {content.startDate} {content.endDate ? `– ${content.endDate}` : ''}
            </span>
          </div>
          <span className="text-[10px] font-medium text-gray-800 italic block mb-1">{content.role}</span>
          <ul className="list-disc leading-tight ml-4 space-y-0.5">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-[11px] text-gray-800 pl-1">{desc}</li>
            ))}
          </ul>
        </div>
      );

    case 'custom-item':
      return (
        <div className="mb-3 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline">
            <h4 className="font-bold text-gray-900 text-[12px]">{content.name}</h4>
            <span className="text-[10px] font-semibold text-gray-700">{content.date || content.startDate}</span>
          </div>
          {content.role && (
            <span className="text-[10px] font-medium text-gray-800 italic block mb-1">{content.role}</span>
          )}
          {content.description && (
            <p className="text-[11px] text-gray-800 mt-0.5 whitespace-pre-wrap leading-tight">
              {content.description}
            </p>
          )}
        </div>
      );

    case 'string-list':
      return (
        <ul className="list-disc leading-tight ml-4 space-y-0.5 font-serif mb-3">
          {content.map((str: string, idx: number) => (
            <li key={idx} className="text-[11px] text-gray-800 pl-1">{str}</li>
          ))}
        </ul>
      );

    default:
      return null;
  }
};

export const ClassicTwoColumnSidebar: React.FC<{ data: ResumeData; accentColor?: string }> = ({ data, accentColor = '#2563eb' }) => {
  const { personalInfo, education, additional } = data;
  
  return (
    <div className="flex flex-col gap-6 font-serif">
      {/* Header Info */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight font-serif">
            {personalInfo?.name || "Your Name"}
        </h1>
        <p className="text-[11px] font-medium text-gray-700 italic border-b-2 pb-2" style={{ borderColor: accentColor }}>
            {personalInfo?.title || "Professional"}
        </p>
      </div>

      {/* Contact Info */}
      <div className="space-y-1">
        <h3 className="uppercase tracking-widest text-[9px] font-bold text-gray-400 mb-1">
            Contact
        </h3>
        <div className="flex flex-col gap-1 text-[11px] text-gray-700">
            {personalInfo?.email && <span>{personalInfo.email}</span>}
            {personalInfo?.phone && <span>{personalInfo.phone}</span>}
            {personalInfo?.location && <span>{personalInfo.location}</span>}
            {personalInfo?.linkedin && <a href={personalInfo.linkedin} className="truncate hover:underline text-blue-800 shrink-0">LinkedIn</a>}
            {personalInfo?.github && <a href={personalInfo.github} className="truncate hover:underline text-blue-800">GitHub</a>}
            {personalInfo?.website && <a href={personalInfo.website} className="truncate hover:underline text-blue-800">Portfolio</a>}
        </div>
      </div>

      {/* Skills */}
      {additional?.technicalSkills && additional.technicalSkills.length > 0 && (
        <div className="space-y-1">
            <h3 className="uppercase tracking-widest text-[11px] font-bold text-gray-900 border-b-2 pb-1 mb-2" style={{ borderColor: accentColor }}>
                Skills
            </h3>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-700">
                {additional.technicalSkills.map((s, i) => (
                    <span key={i}>{s}{i < additional.technicalSkills.length - 1 ? ',' : ''}</span>
                ))}
            </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="space-y-3">
            <h3 className="uppercase tracking-widest text-[11px] font-bold text-gray-900 border-b-2 pb-1 mb-2" style={{ borderColor: accentColor }}>
                Education
            </h3>
            {education.map((edu, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                    <span className="font-bold text-[11px]">{edu.institution}</span>
                    <span className="text-[10px] italic">{edu.degree}</span>
                    <span className="text-[9px] text-gray-500">{edu.startDate} – {edu.endDate}</span>
                </div>
            ))}
        </div>
      )}

      {/* Languages */}
      {additional?.languages && additional.languages.length > 0 && (
        <div className="space-y-1">
            <h3 className="uppercase tracking-widest text-[11px] font-bold text-gray-900 border-b-2 pb-1 mb-2" style={{ borderColor: accentColor }}>
                Languages
            </h3>
            <div className="flex flex-col gap-1 text-[11px] text-gray-700">
                {additional.languages.map((s, i) => (
                    <span key={i}>{s}</span>
                ))}
            </div>
        </div>
      )}

      {/* Certifications & Awards */}
      {(additional?.certificationsTraining?.length > 0 || additional?.awards?.length > 0) && (
        <div className="space-y-3">
             {additional.certificationsTraining?.length > 0 && (
                <div className="space-y-1">
                    <h3 className="uppercase tracking-widest text-[11px] font-bold text-gray-900 border-b-2 pb-1 mb-2" style={{ borderColor: accentColor }}>
                        Certifications
                    </h3>
                    <div className="flex flex-col gap-1 text-[10px] text-gray-700">
                        {additional.certificationsTraining.map((s, i) => (
                            <span key={i} className="leading-tight">{s}</span>
                        ))}
                    </div>
                </div>
             )}
             {additional.awards?.length > 0 && (
                <div className="space-y-1">
                    <h3 className="uppercase tracking-widest text-[11px] font-bold text-gray-900 border-b-2 pb-1 mb-2" style={{ borderColor: accentColor }}>
                        Awards
                    </h3>
                    <div className="flex flex-col gap-1 text-[10px] text-gray-700">
                        {additional.awards.map((s, i) => (
                            <span key={i} className="leading-tight">{s}</span>
                        ))}
                    </div>
                </div>
             )}
        </div>
      )}
    </div>
  );
};
