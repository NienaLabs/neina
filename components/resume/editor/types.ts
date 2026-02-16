import { TemplateType } from "@/lib/types/resume";

export interface ResumeExtraction {
  address?: {
    email?: string
    location?: string
    telephone?: string
    linkedInProfile?: string
    githubProfile?: string
    portfolio?: string
    otherLinks?: string[]
  }

  profile?: string
  summary?: string
  objective?: string

  education?: {
    institution?: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string;
    date_range?: string;
    grade?: string
    description?: string[] | string
    location?: string
    current?: boolean
    expected_graduation?: string;
    id?: string;
    customFields?: { key: string; value: string }[]
  }[]

  experience?: {
    company?: string
    position?: string
    startDate?: string
    endDate?: string;
    date_range?: string;
    location?: string
    description?: string[] | string;
    achievements?: string[]
    title?: string
    responsibilities?: string[]
    current?: boolean
    id?: string;
    customFields?: { key: string; value: string }[]
  }[]

  skills?: Record<string, string[]> | Array<string | { name: string }>

  certifications?: {
    name?: string
    issuer?: string
    year?: string
    date?: string;
    description?: string
    customFields?: { key: string; value: string }[]
  }[]

  projects?: {
    name?: string
    description?: string
    technologies?: string[]
    link?: string
    url?: string;
    role?: string
    startDate?: string;
    endDate?: string;
    id?: string;
    customFields?: { key: string; value: string }[]
  }[]

  personalProjects?: {
    name?: string
    description?: string
    technologies?: string[]
    link?: string
    url?: string;
    role?: string
    startDate?: string;
    endDate?: string;
    id?: string;
    customFields?: { key: string; value: string }[]
  }[]

  awards?: {
    title?: string
    issuer?: string
    year?: string
    date?: string;
    description?: string
    customFields?: { key: string; value: string }[]
  }[]

  publications?: {
    title?: string
    publisher?: string
    date?: string
    description?: string
    link?: string
    customFields?: { key: string; value: string }[]
  }[]

  languages?: {
    name?: string
    proficiency?: string
  }[]

  hobbies?: string[]

  customSections?: {
    sectionName: string
    entries: {
      title?: string
      organization?: string
      description?: string
      year?: string
      date?: string
      customFields?: { key: string; value: string }[]
      id?: string
    }[]
  }[] | Record<string, any>

  // New combined "additional" object for cleaner schema compatibility
  additional?: {
    technicalSkills?: string[];
    languages?: string[];
    certificationsTraining?: string[];
    awards?: string[];
  };

  personalInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  
  // Template preferences
  template?: TemplateType;
  accentColor?: string;

  // Section Order
  sectionMeta?: {
      id: string;
      key: string;
      visible?: boolean;
      order: number;
      isDefault?: boolean;
      displayName?: string;
  }[];
}

export interface Fix {
  severity: 'critical' | 'urgent' | 'low';
  issue: string;
  suggestion: string;
  autoFix?: any;
}

export interface Fixes {
  [section: string]: Fix[] | Record<string, Fix[]>;
}
