
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
    endDate?: string
    grade?: string
    description?: string
    location?: string
  }[]

  experience?: {
    company?: string
    position?: string
    startDate?: string
    endDate?: string
    location?: string
    description?: string
    achievements?: string[]
    title?: string
    responsibilities?: string[]
  }[]

  skills?: Record<string, string[]>

  certifications?: {
    name?: string
    issuer?: string
    year?: string
    description?: string
  }[]

  projects?: {
    name?: string
    description?: string
    technologies?: string[]
    link?: string
    role?: string
  }[]

  awards?: {
    title?: string
    issuer?: string
    year?: string
    description?: string
  }[]

  publications?: {
    title?: string
    publisher?: string
    date?: string
    description?: string
    link?: string
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
    }[]
  }[]
}

export interface Fix {
  severity: 'critical' | 'urgent' | 'low';
  issue: string;
  suggestion: string;
}

export interface Fixes {
  [section: string]: Fix[] | Record<string, Fix[]>;
}
