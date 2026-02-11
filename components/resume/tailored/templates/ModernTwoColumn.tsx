'use client';

import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';
import { ResumeData } from '@/lib/types/resume';
import { ResumePreviewItem } from './ClassicSingle';

export const generateModernTwoColumnItems = (data: ResumeData): ResumePreviewItem[] => {
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
          list.push({ id: 'summary-title', type: 'section-title', content: { title: 'Personal Profile' } });
          list.push({ id: 'summary-content', type: 'summary-content', content: summary });
        }
        break;
      
      case 'workExperience':
        if (workExperience && workExperience.length > 0) {
          list.push({ id: 'exp-title', type: 'section-title', content: { title: 'Professional Experience' } });
          workExperience.forEach((exp, idx) => {
            list.push({ id: `exp-${exp.id || idx}-${idx}`, type: 'experience-item', content: exp });
          });
        }
        break;

      case 'personalProjects':
        if (personalProjects && personalProjects.length > 0) {
          list.push({ id: 'proj-title', type: 'section-title', content: { title: 'Featured Projects' } });
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

export const ModernTwoColumnRenderer: React.FC<{ item: ResumePreviewItem; accentColor?: string }> = ({ item, accentColor = '#2563eb' }) => {
  const { type, content } = item;

  switch (type) {
    case 'section-title':
      return (
        <div className="mb-4 mt-6 flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
          <h3 className="uppercase tracking-[0.2em] text-[11px] font-black text-gray-900">
            {content.title}
          </h3>
        </div>
      );

    case 'summary-content':
      return (
        <p className="text-[12px] text-gray-600 leading-relaxed text-justify mb-4">
          {content}
        </p>
      );

    case 'experience-item':
      return (
        <div className="mb-5 break-inside-avoid group">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-black text-gray-900 text-[13px] transition-colors tracking-tight" style={{ color: 'inherit' }}>
                <span className="group-hover:text-[var(--accent-color)] transition-colors" style={{ '--accent-color': accentColor } as any}>
                    {content.title}
                </span>
            </h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {content.startDate} – {content.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>{content.company}</span>
            <span className="text-[10px] text-gray-400 font-medium">{content.location}</span>
          </div>
          <ul className="list-none space-y-1.5">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-[12px] text-gray-600 flex items-start gap-2 leading-snug">
                <span className="mt-1 flex-shrink-0" style={{ color: accentColor }}>●</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'project-item':
      return (
        <div className="mb-5 break-inside-avoid">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-black text-gray-900 text-[13px] flex items-center gap-2 tracking-tight">
              {content.name}
              {content.url && (
                <a href={content.url} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity" style={{ color: accentColor }}>
                  <ExternalLink size={10} />
                </a>
              )}
            </h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
               {content.startDate} {content.endDate ? `– ${content.endDate}` : ''}
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-2">{content.role}</span>
          <ul className="list-none space-y-1.5">
            {(Array.isArray(content.description) ? content.description : [content.description]).map((desc: string, idx: number) => (
              <li key={idx} className="text-[12px] text-gray-600 flex items-start gap-2 leading-snug">
                <span className="mt-1 flex-shrink-0" style={{ color: accentColor }}>●</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'custom-item':
      return (
        <div className="mb-5 break-inside-avoid">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-black text-gray-900 text-[13px] tracking-tight">{content.name}</h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{content.date || content.startDate}</span>
          </div>
          {content.role && (
            <span className="text-[11px] font-bold uppercase tracking-widest block mb-2" style={{ color: accentColor }}>{content.role}</span>
          )}
          {content.description && (
            <p className="text-[12px] text-gray-600 mt-0.5 whitespace-pre-wrap leading-relaxed">
              {content.description}
            </p>
          )}
        </div>
      );

    case 'string-list':
      return (
        <ul className="list-none space-y-1.5 mb-5">
          {content.map((str: string, idx: number) => (
            <li key={idx} className="text-[12px] text-gray-600 flex items-start gap-2 leading-snug">
               <span className="mt-1 flex-shrink-0" style={{ color: accentColor }}>●</span>
               <span>{str}</span>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
};

export const ModernTwoColumnSidebar: React.FC<{ data: ResumeData; accentColor?: string }> = ({ data, accentColor = '#2563eb' }) => {
  const { personalInfo, education, additional } = data;
  
  return (
    <div className="flex flex-col gap-8">
      {/* Header Info */}
      <div className="space-y-1 overflow-hidden">
        <h1 className="text-2xl font-black text-white leading-tight uppercase truncate">
            {personalInfo?.name || "Your Name"}
        </h1>
        <p className="font-bold uppercase tracking-[0.2em] text-[10px]" style={{ color: accentColor }}>
            {personalInfo?.title || "Professional"}
        </p>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
            Contact Me
        </h3>
        <div className="flex flex-col gap-3 text-[11px] text-gray-300">
            {personalInfo?.email && (
                <div className="flex items-center gap-2">
                    <Mail size={14} className="shrink-0" style={{ color: accentColor }} />
                    <span className="truncate">{personalInfo.email}</span>
                </div>
            )}
            {personalInfo?.phone && (
                <div className="flex items-center gap-2">
                    <Phone size={14} className="shrink-0" style={{ color: accentColor }} />
                    <span>{personalInfo.phone}</span>
                </div>
            )}
            {personalInfo?.location && (
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="shrink-0" style={{ color: accentColor }} />
                    <span>{personalInfo.location}</span>
                </div>
            )}
            <div className="flex gap-4 pt-1">
                {personalInfo?.linkedin && <a href={personalInfo.linkedin} className="hover:text-white transition-colors" style={{ color: accentColor }}><Linkedin size={18} /></a>}
                {personalInfo?.github && <a href={personalInfo.github} className="hover:text-white transition-colors" style={{ color: accentColor }}><Github size={18} /></a>}
                {personalInfo?.website && <a href={personalInfo.website} className="hover:text-white transition-colors" style={{ color: accentColor }}><Globe size={18} /></a>}
            </div>
        </div>
      </div>

      {/* Skills */}
      {additional?.technicalSkills && additional.technicalSkills.length > 0 && (
        <div className="space-y-4">
            <h3 className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
                Primary Skills
            </h3>
            <div className="flex flex-wrap gap-2">
                {additional.technicalSkills.map((s, i) => (
                    <span key={i} className="bg-white/10 text-white px-2 py-1 rounded text-[10px] font-bold border border-white/5">{s}</span>
                ))}
            </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="space-y-4">
            <h3 className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
                Education
            </h3>
            <div className="space-y-4">
                {education.map((edu, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <span className="font-black text-white text-[11px]">{edu.institution}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{edu.degree}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{edu.startDate} – {edu.endDate}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Languages */}
      {additional?.languages && additional.languages.length > 0 && (
        <div className="space-y-3">
            <h3 className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
                Languages
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 font-bold">
                {additional.languages.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                        {s}
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Certifications & Awards */}
      {(additional?.certificationsTraining?.length > 0 || additional?.awards?.length > 0) && (
        <div className="space-y-5 pt-2 border-t border-white/10">
             {additional.certificationsTraining?.length > 0 && (
                <div className="space-y-2">
                    <h3 className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
                        Certifications
                    </h3>
                    <div className="flex flex-col gap-2 text-[10px] text-gray-300 font-medium">
                        {additional.certificationsTraining.map((s, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="opacity-50" style={{ color: accentColor }}>•</span>
                                <span>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}
             {additional.awards?.length > 0 && (
                <div className="space-y-2">
                    <h3 className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
                        Awards
                    </h3>
                    <div className="flex flex-col gap-2 text-[10px] text-gray-300 font-medium">
                        {additional.awards.map((s, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="opacity-50" style={{ color: accentColor }}>•</span>
                                <span>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}
        </div>
      )}
    </div>
  );
};
