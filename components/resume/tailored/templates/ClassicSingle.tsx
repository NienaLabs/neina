'use client';

import React from 'react';
import { ResumeData, WorkExperience, Education, Project } from '@/lib/types/resume';

export type ResumeItemType = 
  | 'personal-info'
  | 'section-title'
  | 'summary-content'
  | 'experience-item'
  | 'education-item'
  | 'project-item'
  | 'skills-block'
  | 'custom-item'
  | 'string-list';

export interface ResumePreviewItem {
  id: string;
  type: ResumeItemType;
  content: any; 
  sectionKey?: string; 
}

export const generateClassicSingleItems = (data: ResumeData): ResumePreviewItem[] => {
  const list: ResumePreviewItem[] = [];
  const { personalInfo, summary, workExperience, education, additional, personalProjects, customSections, sectionMeta } = data;

  if (personalInfo) {
    list.push({ id: 'header', type: 'personal-info', content: personalInfo });
  }

  const sortedSections = (sectionMeta || [])
    .filter(s => s.isVisible && s.id !== 'personalInfo')
    .sort((a, b) => a.order - b.order);

  const defaultOrder = ['summary', 'workExperience', 'education', 'personalProjects', 'additional'];
  const sectionsToRender = sortedSections.length > 0 
    ? sortedSections.map(s => s.key) 
    : [...defaultOrder, ...(customSections ? Object.keys(customSections) : [])];

  sectionsToRender.forEach(key => {
    switch(key) {
      case 'summary':
        if (summary) {
          list.push({ id: 'summary-title', type: 'section-title', content: { title: 'Professional Summary' } });
          list.push({ id: 'summary-content', type: 'summary-content', content: summary });
        }
        break;
      
      case 'workExperience':
        if (workExperience && workExperience.length > 0) {
          list.push({ id: 'exp-title', type: 'section-title', content: { title: 'Experience' } });
          workExperience.forEach((exp, idx) => {
            list.push({ id: `exp-${exp.id || idx}-${idx}`, type: 'experience-item', content: exp });
          });
        }
        break;

      case 'education':
         if (education && education.length > 0) {
           list.push({ id: 'edu-title', type: 'section-title', content: { title: 'Education' } });
           education.forEach((edu, idx) => {
             list.push({ id: `edu-${edu.id || idx}-${idx}`, type: 'education-item', content: edu });
           });
         }
         break;

      case 'personalProjects':
        if (personalProjects && personalProjects.length > 0) {
          list.push({ id: 'proj-title', type: 'section-title', content: { title: 'Projects' } });
          personalProjects.forEach((proj, idx) => {
            list.push({ id: `proj-${proj.id || idx}-${idx}`, type: 'project-item', content: proj });
          });
        }
        break;

      case 'additional':
        const hasSkills = additional && (
          (additional.technicalSkills && additional.technicalSkills.length > 0) ||
          (additional.languages && additional.languages.length > 0) ||
          (additional.certificationsTraining && additional.certificationsTraining.length > 0) ||
          (additional.awards && additional.awards.length > 0)
        );
        if (hasSkills) {
          list.push({ id: 'skills-title', type: 'section-title', content: { title: 'Skills & Additional' } });
          list.push({ id: 'skills-block', type: 'skills-block', content: additional });
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

export const ClassicSingleRenderer: React.FC<{ item: ResumePreviewItem; accentColor?: string }> = ({ item, accentColor = '#2563eb' }) => {
  const { type, content } = item;

  switch (type) {
    case 'personal-info':
      return (
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2 font-serif">
            {content.name || "Your Name"}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-3 text-sm text-gray-700 font-serif">
            {content.email && <span>{content.email}</span>}
            {content.phone && <span>| {content.phone}</span>}
            {content.location && <span>| {content.location}</span>}
            {content.linkedin && (
              <span>| <a href={content.linkedin} className="hover:underline" style={{ color: accentColor }}>LinkedIn</a></span>
            )}
            {content.github && (
              <span>| <a href={content.github} className="hover:underline" style={{ color: accentColor }}>GitHub</a></span>
            )}
            {content.website && (
              <span>| <a href={content.website} className="hover:underline" style={{ color: accentColor }}>Portfolio</a></span>
            )}
          </div>
        </div>
      );

    case 'section-title':
      return (
        <div className="mb-2 mt-4">
          <h3 className="uppercase tracking-widest text-xs font-bold text-gray-900 border-b-2 pb-0.5 font-serif" style={{ borderColor: accentColor }}>
            {content.title}
          </h3>
        </div>
      );

    case 'summary-content':
      return (
        <p className="text-sm text-gray-800 leading-relaxed text-justify mb-4 font-serif">
          {content}
        </p>
      );

    case 'experience-item':
      return (
        <div className="mb-4 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-bold text-gray-900 text-sm">{content.title}</h4>
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              {content.startDate} – {content.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-gray-800 italic">{content.company}</span>
            <span className="text-xs text-gray-600">{content.location}</span>
          </div>
          <ul className="list-disc leading-relaxed ml-4 space-y-1">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-800 pl-1">{desc}</li>
            ))}
          </ul>
        </div>
      );

    case 'education-item':
      return (
        <div className="mb-3 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline">
            <h4 className="font-bold text-gray-900 text-sm">{content.institution}</h4>
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              {content.startDate ? `${content.startDate} – ` : ''}{content.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-800">{content.degree}</span>
            <span className="text-xs text-gray-600">{content.location}</span>
          </div>
          {(Array.isArray(content.description) ? content.description : [content.description]).length > 0 && (
            <div className="mt-1 text-sm text-gray-700">
              {(Array.isArray(content.description) ? content.description : [content.description]).join(', ')}
            </div>
          )}
        </div>
      );

    case 'project-item':
      return (
        <div className="mb-3 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline">
            <h4 className="font-bold text-gray-900 text-sm">
              {content.name}
              {content.url && (
                <a href={content.url} target="_blank" rel="noreferrer" className="ml-2 hover:underline font-normal text-xs" style={{ color: accentColor }}>
                  Link ↗
                </a>
              )}
            </h4>
            <span className="text-xs font-semibold text-gray-700">
              {content.startDate} {content.endDate ? `– ${content.endDate}` : ''}
            </span>
          </div>
          <span className="text-xs font-medium text-gray-800 italic block mb-1">{content.role}</span>
          <ul className="list-disc leading-relaxed ml-4 space-y-1">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-800 pl-1">{desc}</li>
            ))}
          </ul>
        </div>
      );

    case 'skills-block':
      const { technicalSkills, languages, certificationsTraining, awards } = content;
      return (
        <div className="space-y-2 text-sm text-gray-800 mb-4 font-serif">
          {technicalSkills?.length > 0 && (
            <div className="grid grid-cols-[160px_1fr] gap-2">
              <span className="font-bold">Technical Skills:</span>
              <span>{technicalSkills.join(', ')}</span>
            </div>
          )}
          {languages?.length > 0 && (
            <div className="space-y-1">
              <span className="font-bold">Languages:</span> {languages.join(', ')}
            </div>
          )}
          {certificationsTraining?.length > 0 && (
            <div className="space-y-1">
              <span className="font-bold">Certifications:</span> {certificationsTraining.join(', ')}
            </div>
          )}
          {awards?.length > 0 && (
            <div className="grid grid-cols-[160px_1fr] gap-2">
              <span className="font-bold">Awards:</span>
              <span>{awards.join(', ')}</span>
            </div>
          )}
        </div>
      );

    case 'custom-item':
      return (
        <div className="mb-3 break-inside-avoid font-serif">
          <div className="flex justify-between items-baseline">
            <h4 className="font-bold text-gray-900 text-sm">{content.name}</h4>
            <span className="text-xs font-semibold text-gray-700">{content.date || content.startDate}</span>
          </div>
          {content.role && (
            <span className="text-xs font-medium text-gray-800 italic block mb-1">{content.role}</span>
          )}
          <div className="flex flex-wrap gap-x-3 text-xs text-gray-600 mb-1">
            {content.email && <span>{content.email}</span>}
            {content.phone && <span>{content.phone}</span>}
          </div>
          {content.description && (
            <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap leading-relaxed">
              {content.description}
            </p>
          )}
        </div>
      );

    case 'string-list':
      return (
        <ul className="list-disc leading-relaxed ml-4 space-y-1 font-serif mb-4">
          {content.map((str: string, idx: number) => (
            <li key={idx} className="text-sm text-gray-800 pl-1">{str}</li>
          ))}
        </ul>
      );

    default:
      return null;
  }
};
