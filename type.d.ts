 interface ResumeExtraction {
  address: {
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
    location?:string
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

  skills?: Record<string,string[]>
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
    link?:string
  }[]

  languages?: {
    name?: string
    proficiency?: string
  }[]

  hobbies?: string[]

  /**
   * Any sections not part of our schema
   * e.g. "Volunteer Experience", "Research", etc.
   */
  customSections?:   {
      sectionName: string,
      entries: [
        {
          title?: string,
          organization?: string,
          description?: string,
          year?: string
        }
      ]
    }[]
}

interface ResumeAnalysis {
  /**
   * Number of issues considered critical (must-fix)
   */
  criticalFixesCount: number

  /**
   * Number of issues considered urgent but not critical
   */
  urgentFixesCount: number

  /**
   * Detailed fixes per section
   * Each section contains an array of issue objects
   */
  fixes: Record<
    string,
    {
      issue: string
      suggestion: string
      severity: 'critical' | 'urgent' | 'minor'
    }[]
  >
}

interface ResumeScore {
  /**
   * Section-wise scoring between 0–100
   */
  sectionScores: Record<string, number>

  /**
   * Overall resume score for a specific job role
   */
  overallScore: number

  /**
   * Optional textual feedback summarizing performance
   */
  feedback?: string
}

