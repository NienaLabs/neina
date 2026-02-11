export type SectionType = 'default' | 'text' | 'itemList' | 'stringList';
export type TemplateType = 'classic-single' | 'modern-single' | 'classic-two' | 'modern-two';

export interface SectionMeta {
  id: string;
  key: string; // key in ResumeData
  displayName: string;
  displayIcon?: string;
  isVisible: boolean;
  isDefault: boolean;
  sectionType: SectionType;
  order: number;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary?: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[]; // Bullet points
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
  url?: string;
}

export interface SkillGroup {
  name: string;
  skills: string[];
}

export interface CustomSection {
  text?: string;
  items?: any[];
  strings?: string[];
  sectionType: SectionType;
  displayName?: string; // Content-driven display name
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  personalProjects: Project[];
  additional: {
    technicalSkills: string[]; // Simple list
    languages: string[];
    certificationsTraining: string[];
    awards: string[];
  };
  customSections?: Record<string, CustomSection>;
  sectionMeta?: SectionMeta[]; // Order and visibility config
  template?: TemplateType;
  accentColor?: string; // hex color for branding
}

export const DEFAULT_SECTION_META: SectionMeta[] = [
  { id: 'personalInfo', key: 'personalInfo', displayName: 'Personal Info', isVisible: true, isDefault: true, sectionType: 'default', order: 0 },
  { id: 'summary', key: 'summary', displayName: 'Summary', isVisible: true, isDefault: true, sectionType: 'default', order: 1 },
  { id: 'workExperience', key: 'workExperience', displayName: 'Experience', isVisible: true, isDefault: true, sectionType: 'default', order: 2 },
  { id: 'education', key: 'education', displayName: 'Education', isVisible: true, isDefault: true, sectionType: 'default', order: 3 },
  { id: 'personalProjects', key: 'personalProjects', displayName: 'Projects', isVisible: true, isDefault: true, sectionType: 'default', order: 4 },
  { id: 'additional', key: 'additional', displayName: 'Skills & Additional', isVisible: true, isDefault: true, sectionType: 'default', order: 5 },
];
