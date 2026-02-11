'use client';

import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';
import { ResumeData } from '@/lib/types/resume';
import { ResumePreviewItem } from './ClassicSingle';

export const generateModernSingleItems = (data: ResumeData): ResumePreviewItem[] => {
  // Logic is similar to ClassicSingle but we could customize ordering if needed
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
          list.push({ id: 'summary-title', type: 'section-title', content: { title: 'Profile' } });
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
          list.push({ id: 'skills-title', type: 'section-title', content: { title: 'Technical Stack & Awards' } });
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

export const ModernSingleRenderer: React.FC<{ item: ResumePreviewItem; accentColor?: string }> = ({ item, accentColor = '#2563eb' }) => {
  const { type, content } = item;

  switch (type) {
    case 'personal-info':
      return (
        <div className="flex justify-between items-start mb-8 pb-6 border-b-4" style={{ borderColor: accentColor }}>
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-1 text-gray-900 leading-none uppercase">
                {content.name || "Your Name"}
            </h1>
            <p className="font-bold uppercase tracking-[0.2em] text-sm" style={{ color: accentColor }}>
                {content.title || "Professional"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-[10px] font-medium text-gray-600">
            {content.email && (
              <div className="flex items-center gap-2">
                <span>{content.email}</span>
                <Mail size={12} style={{ color: accentColor }} />
              </div>
            )}
            {content.phone && (
              <div className="flex items-center gap-2">
                <span>{content.phone}</span>
                <Phone size={12} style={{ color: accentColor }} />
              </div>
            )}
            {content.location && (
              <div className="flex items-center gap-2">
                <span>{content.location}</span>
                <MapPin size={12} style={{ color: accentColor }} />
              </div>
            )}
             <div className="flex gap-3 mt-1.5">
                {content.linkedin && <a href={content.linkedin} className="text-gray-400" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = accentColor} onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}><Linkedin size={14} /></a>}
                {content.github && <a href={content.github} className="text-gray-400 hover:text-gray-900"><Github size={14} /></a>}
                {content.website && <a href={content.website} className="text-gray-400 hover:text-blue-500"><Globe size={14} /></a>}
             </div>
          </div>
        </div>
      );

    case 'section-title':
      return (
        <div className="mb-4 flex items-center gap-4">
          <h3 className="uppercase tracking-[0.25em] text-xs font-black whitespace-nowrap" style={{ color: accentColor }}>
            {content.title}
          </h3>
          <div className="h-[1px] w-full" style={{ backgroundColor: `${accentColor}20` }} />
        </div>
      );

    case 'summary-content':
      return (
        <p className="text-[13px] text-gray-700 leading-relaxed mb-6 font-medium">
          {content}
        </p>
      );

    case 'experience-item':
      return (
        <div className="mb-6 break-inside-avoid relative pl-4 border-l-2 border-gray-100 group">
          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: `${accentColor}40` }} />
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-extrabold text-gray-900 text-sm tracking-tight">{content.title}</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: accentColor, backgroundColor: `${accentColor}10` }}>
              {content.startDate} – {content.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{content.company}</span>
            <span className="text-[10px] text-gray-400 font-medium italic">{content.location}</span>
          </div>
          <ul className="list-none space-y-1.5">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-[12px] text-gray-600 flex items-start gap-2">
                <span className="mt-1 flex-shrink-0" style={{ color: accentColor }}>▹</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'education-item':
      return (
        <div className="mb-4 break-inside-avoid relative pl-4 border-l-2 border-gray-100">
          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300" />
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-extrabold text-gray-900 text-sm tracking-tight">{content.institution}</h4>
            <span className="text-[10px] font-bold text-gray-500">
              {content.startDate ? `${content.startDate} – ` : ''}{content.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold" style={{ color: accentColor }}>{content.degree}</span>
            <span className="text-[10px] text-gray-400 font-medium">{content.location}</span>
          </div>
          {(Array.isArray(content.description) ? content.description : [content.description]).length > 0 && (
            <div className="mt-1.5 text-[11px] text-gray-500 font-medium italic">
              {(Array.isArray(content.description) ? content.description : [content.description]).join(', ')}
            </div>
          )}
        </div>
      );

    case 'project-item':
      return (
        <div className="mb-4 break-inside-avoid relative pl-4 border-l-2 border-gray-100">
          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-200" />
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-extrabold text-gray-900 text-sm tracking-tight flex items-center gap-2">
              {content.name}
              {content.url && (
                <a href={content.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                  <ExternalLink size={10} />
                </a>
              )}
            </h4>
            <span className="text-[10px] font-bold text-gray-500">
              {content.startDate} {content.endDate ? `– ${content.endDate}` : ''}
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{content.role}</span>
          <ul className="list-none space-y-1">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-[12px] text-gray-600 flex items-start gap-2">
                <span className="mt-1 flex-shrink-0" style={{ color: accentColor }}>•</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'skills-block':
      const { technicalSkills, languages, certificationsTraining, awards } = content;
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs mb-6">
          {technicalSkills?.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {technicalSkills.map((s: string, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">{s}</span>
                ))}
              </div>
            </div>
          )}
          {languages?.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">Languages</span>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((s: string, i: number) => (
                    <span key={i} className="font-bold" style={{ color: accentColor }}>{s}{i < languages.length - 1 ? ',' : ''}</span>
                ))}
              </div>
            </div>
          )}
          {certificationsTraining?.length > 0 && (
             <div className="space-y-1.5 col-span-2">
                <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">Certifications</span>
                <div className="grid grid-cols-2 gap-2">
                    {certificationsTraining.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                            {s}
                        </div>
                    ))}
                </div>
             </div>
          )}
          {awards?.length > 0 && (
             <div className="space-y-1.5 col-span-2">
                <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">Awards</span>
                <div className="grid grid-cols-2 gap-2">
                    {awards.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                            {s}
                        </div>
                    ))}
                </div>
             </div>
          )}
        </div>
      );

    case 'custom-item':
      return (
        <div className="mb-4 break-inside-avoid relative pl-4 border-l-2 border-gray-100">
           <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-200" />
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-extrabold text-gray-900 text-sm tracking-tight">{content.name}</h4>
            <span className="text-[10px] font-bold text-gray-500">{content.date || content.startDate}</span>
          </div>
          {content.role && (
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-widest block mb-2">{content.role}</span>
          )}
          <div className="flex flex-wrap gap-x-4 text-[10px] text-gray-400 font-bold mb-2">
            {content.email && <span className="flex items-center gap-1"><Mail size={10} /> {content.email}</span>}
            {content.phone && <span className="flex items-center gap-1"><Phone size={10} /> {content.phone}</span>}
          </div>
          {content.description && (
            <p className="text-[12px] text-gray-600 mt-0.5 whitespace-pre-wrap leading-relaxed">
              {content.description}
            </p>
          )}
        </div>
      );

    case 'string-list':
      return (
        <ul className="list-none space-y-1.5 mb-6">
          {content.map((str: string, idx: number) => (
            <li key={idx} className="text-[12px] text-gray-600 flex items-start gap-2 pl-4 border-l-2 border-gray-100 relative">
               <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: `${accentColor}40` }} />
               <span className="mt-1 flex-shrink-0" style={{ color: accentColor }}>•</span>
               <span>{str}</span>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
};
