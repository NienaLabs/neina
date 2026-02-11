import { notFound } from "next/navigation";
import { trpc } from "@/trpc/server";
import { ResumeBuilder } from "@/components/resume/tailored/ResumeBuilder";
import { ResumeData, DEFAULT_SECTION_META } from "@/lib/types/resume";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TailoredResumeEditPage({ params }: PageProps) {
  const { id } = await params;
  
  const resume = await trpc.resume.getUnique({ resumeId: id });

  if (!resume) {
    return notFound();
  }

  // Parse data Safely
  let extractedData;
  try {
      extractedData = typeof resume.extractedData === 'string' 
        ? JSON.parse(resume.extractedData) 
        : resume.extractedData;
  } catch (e) {
      console.error("Failed to parse extractedData", e);
      extractedData = null;
  }




  // Analysis Data
  let analysisDataRaw;
  try {
    analysisDataRaw = typeof resume.analysisData === 'string'
        ? JSON.parse(resume.analysisData)
        : resume.analysisData;
  } catch (e) {
      console.error("Failed to parse analysisData", e);
      analysisDataRaw = null;
  }
    
  const matchedKeywords = (analysisDataRaw?.matches || []) as string[];
  const missingKeywords = (analysisDataRaw?.missing || []) as string[];

      // Data Mapper to convert AI Extraction -> Frontend ResumeData
  const mapExtractionToResumeData = (extraction: any, resumeName: string): ResumeData => {
      // Create default structure if extraction is null
      if (!extraction) {
          return {
              personalInfo: { name: resumeName, title: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
              summary: '',
              workExperience: [],
              education: [],
              personalProjects: [],
              additional: { technicalSkills: [], languages: [], certificationsTraining: [], awards: [] },
              customSections: {}
          };
      }

      // Helper to ensure array
      const asArray = (val: any) => Array.isArray(val) ? val : [];
      
      // Helper to format string data safely
      const safeStr = (val: any) => (val && typeof val === 'string') ? val : '';

      // Helper to process skills (handle object vs array)
      const processSkills = (skillsData: any): string[] => {
          if (!skillsData) return [];
          if (Array.isArray(skillsData)) return skillsData.map(s => typeof s === 'string' ? s : safeStr(s.name));
          if (typeof skillsData === 'object') {
             // Flatten all values
             return Object.values(skillsData).flat().map(String);
          }
          return [];
      };

      // Date Parser Helper: Matches "Date - Date" or "Date to Date"
      const parseDateRange = (range: string) => {
          if (!range) return { start: '', end: '' };
          // Split by en-dash, em-dash, hyphen, or " to "
          const parts = range.split(/–|—|-|\sto\s/);
          if (parts.length >= 2) {
              return { start: parts[0].trim(), end: parts[1].trim() };
          }
          return { start: range.trim(), end: '' };
      };

      // Dynamic Keys Processing (Referees, Volunteering, etc.)
      const standardKeys = new Set([
          'name', 'address', 'profile', 'summary', 'objective', 
          'education', 'experience', 'projects', 'skills', 
          'certifications', 'awards', 'publications', 'languages', 'hobbies', 'customSections',
          'workExperience', 'personalProjects', 'additional', 'personalInfo' // Added new schema keys
      ]);

      const foundCustomSections: Record<string, any> = {};
      
      // 1. Process explicit customSections
      if (extraction.customSections && typeof extraction.customSections === 'object' && !Array.isArray(extraction.customSections)) {
          Object.keys(extraction.customSections).forEach(originalKey => {
             const section = extraction.customSections[originalKey];
             const key = safeStr(originalKey).toLowerCase().replace(/\s+/g, '-');
             
             if (key) {
                 foundCustomSections[key] = {
                     text: '',
                     items: (section.items || []).map((entry: any) => ({
                          id: Math.random().toString(36).substr(2, 9),
                          name: safeStr(entry.name) || safeStr(entry.title) || safeStr(entry.organization) || '',
                          role: safeStr(entry.role),
                          email: safeStr(entry.email),
                          phone: safeStr(entry.phone),
                          description: safeStr(entry.description) || '',
                          date: safeStr(entry.date) || safeStr(entry.startDate) || safeStr(entry.year) || '',
                      })),
                      sectionType: section.sectionType || 'itemList',
                      displayName: section.displayName || originalKey
                 };
             }
          });
      }
      // Fallback for Array format (Legacy support)
      else if (Array.isArray(extraction.customSections)) {
          extraction.customSections.forEach((section: any) => {
              const key = safeStr(section.sectionName).toLowerCase().replace(/\s+/g, '-');
              if (key) {
                  foundCustomSections[key] = {
                      text: '',
                      items: (section.items || section.entries || []).map((entry: any) => ({
                          id: Math.random().toString(36).substr(2, 9),
                          name: safeStr(entry.name) || safeStr(entry.title) || safeStr(entry.organization) || '',
                          role: safeStr(entry.role),
                          email: safeStr(entry.email),
                          phone: safeStr(entry.phone),
                          description: safeStr(entry.description) || '',
                          date: safeStr(entry.date) || safeStr(entry.year) || '',
                      })),
                      sectionType: 'itemList',
                      displayName: section.sectionName
                  };
              }
          });
      }

      // 2. Process implicit custom sections (keys not in standard list)
      Object.keys(extraction).forEach(key => {
          if (!standardKeys.has(key) && extraction[key]) {
              const val = extraction[key];
              // Map implicit sections
              if (Array.isArray(val)) {
                   // Check if array of objects or strings
                   const isStringArray = val.length > 0 && typeof val[0] === 'string';
                   
                   if (isStringArray) {
                       // Map string array (e.g. voluntaryExtraCurricular) -> List of items
                       foundCustomSections[key] = {
                           text: '',
                           items: val.map((str: string) => ({
                               id: Math.random().toString(36).substr(2, 9),
                               name: '', // No title
                               description: str,
                               date: ''
                           })),
                           sectionType: 'itemList',
                           displayName: key.replace(/([A-Z])/g, ' $1').trim() // CamelCase -> Camel Case
                       };
                   } else {
                       // Array of objects (e.g. referees)
                       foundCustomSections[key] = {
                           text: '',
                           items: val.map((item: any) => ({
                               id: Math.random().toString(36).substr(2, 9),
                               name: safeStr(item.name) || safeStr(item.title) || safeStr(item.organization) || '',
                               role: safeStr(item.role),
                               email: safeStr(item.email),
                               phone: safeStr(item.phone),
                               description: [
                                   safeStr(item.company),
                                   safeStr(item.description)
                               ].filter(Boolean).join(', '),
                               date: safeStr(item.date) || safeStr(item.year) || ''
                           })),
                           sectionType: 'itemList',
                           displayName: key.replace(/([A-Z])/g, ' $1').trim()
                       };
                   }
              }
          }
      });

      // Unified extraction logic
      const workExperienceRaw = extraction.workExperience || extraction.experience || [];
      const projectsRaw = extraction.personalProjects || extraction.projects || [];
      // Personal Info: check extraction.personalInfo (new schema) or spread extraction (old schema)
      // If new schema, extraction.personalInfo exists. If old, fields like name/address are top level.
      const personalInfoSource = extraction.personalInfo || extraction;
      const addressSource = extraction.address || extraction.personalInfo || {};

      return {
          personalInfo: {
              name: safeStr(personalInfoSource.name) || safeStr(addressSource.name) || resumeName, 
              title: safeStr(personalInfoSource.title) || safeStr(personalInfoSource.position) || safeStr(extraction.profile?.split('.')[0]) || 'Professional',
              email: safeStr(personalInfoSource.email) || safeStr(addressSource.email),
              phone: safeStr(personalInfoSource.phone) || safeStr(addressSource.telephone) || safeStr(addressSource.phone),
              location: safeStr(personalInfoSource.location) || safeStr(addressSource.location),
              linkedin: safeStr(personalInfoSource.linkedin) || safeStr(addressSource.linkedInProfile) || safeStr(addressSource.linkedin),
              github: safeStr(personalInfoSource.github) || safeStr(addressSource.githubProfile) || safeStr(addressSource.github),
              website: safeStr(personalInfoSource.website) || safeStr(addressSource.portfolio) || safeStr(addressSource.website),
              summary: safeStr(extraction.summary) || safeStr(extraction.profile) || safeStr(extraction.objective)
          },
          summary: safeStr(extraction.summary) || safeStr(extraction.profile) || safeStr(extraction.objective) || '',
          workExperience: asArray(workExperienceRaw).map((exp: any, i: number) => {
              // Handle date_range
              const { start, end } = parseDateRange(exp.date_range || '');
              // Handle descriptions (string, string[], or specific fields)
              const descArray = Array.isArray(exp.description) ? exp.description : (safeStr(exp.description) ? [exp.description] : []);
              
              return {
                  id: exp.id || `exp-${Math.random().toString(36).substr(2, 9)}`,
                  title: safeStr(exp.title) || safeStr(exp.position) || '',
                  company: safeStr(exp.company) || '',
                  location: safeStr(exp.location) || '',
                  startDate: safeStr(exp.startDate) || start,
                  endDate: safeStr(exp.endDate) || end || (exp.current ? 'Present' : ''),
                  current: !!exp.current || safeStr(exp.endDate).toLowerCase() === 'present', 
                  description: [
                      ...(asArray(exp.responsibilities)), 
                      ...(asArray(exp.achievements)),
                      ...descArray
                  ].filter(Boolean)
              };
          }),
          education: asArray(extraction.education).map((edu: any, i: number) => {
              const { start, end } = parseDateRange(edu.date_range || '');
              const descArray = Array.isArray(edu.description) ? edu.description : (safeStr(edu.description) ? [edu.description] : []);

              return {
                  id: edu.id || `edu-${Math.random().toString(36).substr(2, 9)}`,
                  institution: safeStr(edu.institution) || '',
                  degree: safeStr(edu.degree) || safeStr(edu.qualification) || '',
                  location: safeStr(edu.location) || '',
                  startDate: safeStr(edu.startDate) || start,
                  endDate: safeStr(edu.endDate) || end || (edu.expected_graduation ? `Exp. ${edu.expected_graduation}` : ''),
                  current: !!edu.current || safeStr(edu.endDate).toLowerCase() === 'present',
                  description: descArray
              };
          }),
          personalProjects: asArray(projectsRaw).map((proj: any, i: number) => ({
              id: proj.id || `proj-${Math.random().toString(36).substr(2, 9)}`,
              name: safeStr(proj.name) || '',
              role: safeStr(proj.role) || '',
              startDate: safeStr(proj.startDate) || '',
              endDate: safeStr(proj.endDate) || '',
              current: false,
              url: safeStr(proj.url) || safeStr(proj.link) || '',
              description: [
                  ...(asArray(proj.technologies).length > 0 ? [`Technologies: ${asArray(proj.technologies).join(', ')}`] : []),
                  safeStr(proj.description)
              ].filter(Boolean)
          })),
          additional: {
              technicalSkills: extraction.additional?.technicalSkills 
                  ? extraction.additional.technicalSkills 
                  : (extraction.skills?.technical ? extraction.skills.technical : processSkills(extraction.skills)),
              
              languages: extraction.additional?.languages
                  ? extraction.additional.languages
                  : (extraction.languages ? asArray(extraction.languages).map((l: any) => l.name || l) : (extraction.skills?.languages || [])),
              
              certificationsTraining: extraction.additional?.certificationsTraining
                  ? extraction.additional.certificationsTraining
                  : asArray(extraction.certifications).map((c: any) => safeStr(c.name)),
              
              awards: extraction.additional?.awards
                  ? extraction.additional.awards
                  : asArray(extraction.awards).map((a: any) => safeStr(a.title))
          },
          customSections: foundCustomSections,
          sectionMeta: [
              ...DEFAULT_SECTION_META,
              ...Object.keys(foundCustomSections).map((key, idx) => ({
                  id: key,
                  key: key,
                  displayName: foundCustomSections[key].displayName,
                  isVisible: true,
                  isDefault: false,
                  sectionType: foundCustomSections[key].sectionType || 'itemList',
                  order: DEFAULT_SECTION_META.length + idx
              }))
          ]
      };
  }

  // Normalize to ResumeData type using the mapper
  const resumeData = mapExtractionToResumeData(extractedData, resume.name);

  // Scores
  const scores = typeof resume.scores === 'string'
      ? JSON.parse(resume.scores)
      : resume.scores;

  const score = (scores?.wordMatchScore !== undefined ? scores.wordMatchScore : scores?.finalScore) || 0;
  
  // Job Description
  const jobDescription = (resume as any).jobDescription || "";

  return (
    <ResumeBuilder 
        resumeId={id}
        initialData={resumeData}
        jobDescription={jobDescription}
        matchedKeywords={matchedKeywords}
        missingKeywords={missingKeywords}
        wordMatchScore={score}
        status={resume.status}
        coverLetter={(resume as any).coverLetter}
    />
  );
}
