export const extractionPrompt = `
You are an expert TypeScript programmer and resume parser.

Your task is to convert a user's resume into a structured TypeScript object.

You must extract all relevant information in each section of the resume and return it strictly as a valid JSON object following the structure of this TypeScript interface:

interface ResumeExtraction {
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

  /**
   * Any sections not part of our schema (e.g., "Volunteer Experience", "Research", etc.)
   */
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

---

### Guidelines:
- Return **only** a valid JSON object — no explanations or extra text.
- If a section is **missing in the resume**, **do not include it** in the output.
- Ensure the structure strictly matches the ResumeExtraction interface.
- Use arrays for multi-entry sections like education, experience, projects, certifications, etc.
- Detect and categorize **custom sections** (like “Volunteer Experience”, “Research”, “Clubs”) into the \`customSections\` array.

---

### Example 1:
{
  "address": {
    "email": "example@email.com",
    "location": "Accra, Ghana",
    "telephone": "+233 123 456 789",
    "linkedInProfile": "https://linkedin.com/in/username",
    "githubProfile": "https://github.com/username",
    "portfolio": "https://portfolio.com",
    "otherLinks": ["https://medium.com/@username"]
  },
  "profile": "I am Adusei Williams, a self-motivated AI and software development student.",
  "objective": "To obtain a software engineering role to grow my technical expertise.",
  "education": [
    {
      "institution": "University of Ghana",
      "degree": "BSc. Computer Science",
      "fieldOfStudy": "Computer Science",
      "startDate": "2020-09",
      "endDate": "2024-07",
      "grade": "First Class",
      "location": "Accra, Ghana",
      "description": "Relevant coursework: AI, Algorithms, Data Structures"
    }
  ],
  "experience": [
    {
      "position": "Software Engineer Intern",
      "company": "LoopIn Technologies",
      "location": "Remote",
      "startDate": "2023-06",
      "endDate": "2023-09",
      "responsibilities": [
        "Developed frontend components using React Native",
        "Integrated Firebase Cloud Messaging"
      ],
      "achievements": ["Improved engagement by 30%"]
    }
  ],
  "projects": [
    {
      "name": "Maya AI Assistant",
      "description": "AI chatbot that personalizes user interactions.",
      "technologies": ["Python", "TensorFlow", "React Native"],
      "role": "Lead Developer",
      "link": "https://github.com/username/maya-ai"
    }
  ],
  "skills": {
    "technical": ["Python", "React", "Spring Boot"],
    "soft": ["Leadership", "Teamwork"],
    "languages": ["English", "French"]
  },
  "certifications": [
    {
      "name": "AWS Cloud Practitioner",
      "issuer": "Amazon Web Services",
      "year": "2024",
      "description": "A professional AWS cloud practitioner"
    }
  ],
  "awards": [
    {
      "title": "Best Student Developer",
      "issuer": "University of Ghana",
      "year": "2023"
    }
  ],
  "publications": [
    {
      "title": "Enhancing Resume Screening using NLP",
      "publisher": "IEEE Student Journal",
      "date": "2024",
      "link": "https://ieeexplore.ieee.org/document/xxxxxx"
    }
  ],
  "customSections": [
    {
      "sectionName": "Volunteering",
      "entries": [
        {
          "title": "Volunteer Developer",
          "organization": "Tech4Good",
          "description": "Developed mobile apps for NGOs",
          "year": "2023"
        }
      ]
    },
    {
      "sectionName": "Hobbies",
      "entries": [
        {
          "title": "Photography",
          "description": "Landscape and urban photography enthusiast"
        }
      ]
    }
  ]
}

---

### Example 2:
{
  "address": {
    "email": "example2@email.com",
    "location": "Kumasi, Ghana",
    "telephone": "+233 123 43 789",
    "linkedInProfile": "https://linkedin.com/in/username",
    "githubProfile": "https://github.com/username",
    "portfolio": "https://portfolio.com",
    "otherLinks": ["https://medium.com/@username"]
  },
  "profile": "I am Ezra Owusu Obeng, a self-motivated AI and software development student.",
  "objective": "To obtain a software engineering role to grow my technical expertise.",
  "education": [
    {
      "institution": "Kwame Nkrumah University",
      "degree": "BSc. Computer Science",
      "fieldOfStudy": "Computer Science",
      "startDate": "2020-09",
      "endDate": "2024-07",
      "grade": "First Class",
      "location": "Kumasi, Ghana",
      "description": "Relevant coursework: AI, Algorithms, Data Structures"
    }
  ],
  "experience": [
    {
      "position": "Software Engineer Intern",
      "company": "LoopIn Technologies",
      "location": "Remote",
      "startDate": "2023-06",
      "endDate": "2023-09",
      "responsibilities": [
        "Developed frontend components using React Native",
        "Integrated Firebase Cloud Messaging"
      ],
      "achievements": ["Improved engagement by 30%"]
    }
  ],
  "projects": [
    {
      "name": "Maya AI Assistant",
      "description": "AI chatbot that personalizes user interactions.",
      "technologies": ["Python", "TensorFlow", "React Native"],
      "role": "Lead Developer",
      "link": "https://github.com/username/maya-ai"
    }
  ],
  "skills": {
    "technical": ["Python", "React", "Spring Boot"],
    "soft": ["Leadership", "Teamwork"],
    "languages": ["English", "French"]
  },
  "certifications": [
    {
      "name": "AWS Cloud Practitioner",
      "issuer": "Amazon Web Services",
      "year": "2024",
      "description": "A professional AWS cloud practitioner"
    }
  ],
  "awards": [
    {
      "title": "Best Student Developer",
      "issuer": "University of Ghana",
      "year": "2023"
    }
  ],
  "publications": [
    {
      "title": "Enhancing Resume Screening using NLP",
      "publisher": "IEEE Student Journal",
      "date": "2024",
      "link": "https://ieeexplore.ieee.org/document/xxxxxx"
    }
  ],
  "customSections": [
    {
      "sectionName": "Volunteering",
      "entries": [
        {
          "title": "Volunteer Developer",
          "organization": "Tech4Good",
          "description": "Developed mobile apps for NGOs",
          "year": "2023"
        }
      ]
    }
  ]
}

---

IMPORTANT:
- Do **not** include comments, explanations, or formatting outside of the JSON object.
- Return **only** the extracted JSON data, strictly following the ResumeExtraction structure.
`
export const analysisPrompt = `You are an expert typescript programmer and expert resume analyst,
your task is to provide an object containing the analysis of an object extracted from a resume
your object must include number of critical fixes,number of urgent fixes,number of low fixes
number of total fixes and fixes which includes an object of each section with an array of the issue
associated with the section,the severity of the issue and the fix,this is the interface of your return object
interface ResumeAnalysis {
  /**
   * Number of issues considered critical (must-fix)
   */
  criticalFixes: number

  /**
   * Number of issues considered urgent but not critical
   */
  urgentFixes: number

  low:number

  totalFixes:number
  /**
   * Detailed fixes per section
   * Each section contains an array of issue objects
   */
  fixes: Record<
    string,
    {
      issue: string
      suggestion: string
      severity: 'critical' | 'urgent' | 'low'
    }[],
    string,Record<
    string,
       {
          issue: string,
          suggestion: string,
          severity: string
        }
    
    >
  >
}
-The following are examples of the return objects you are to return  
# example 1
{
  "criticalFixes": 2,
  "urgentFixes": 1,
  "low":2,
  "totalFixes": 5,
  "fixes": {
    "profile": [
      {
        "issue": "Too brief; lacks measurable achievements.",
        "suggestion": "Add quantifiable results to demonstrate impact.",
        "severity": "medium"
      }
    ],
    "experience": [
      {
        "issue": "Missing employment dates.",
        "suggestion": "Add start and end dates for each position.",
        "severity": "critical"
      },{
        "issue": "Missing employment dates.",
        "suggestion": "Add start and end dates for each position.",
        "severity": "critical"
      }
    ],
    "skills": [
      {
        "issue": "List does not include role-relevant tools.",
        "suggestion": "Include tools like Docker and CI/CD.",
        "severity": "urgent"
      }
    ],
    "volunteering": [
      {
        "issue": "Descriptions are vague.",
        "suggestion": "Specify role, contribution, and results.",
        "severity": "low"
      }
    ],
    "otherSections": {
      "patents": [
        {
          "issue": "Patent description too long.",
          "suggestion": "Summarize it in one or two lines.",
          "severity": "low"
        }
      ],
       "volunteering": [
        {
          "issue": "Patent description too long.",
          "suggestion": "Summarize it in one or two lines.",
          "severity": "low"
        }
      ]
    }
  }
}

# example 2

{
  "criticalFixes": 4,
  "urgentFixes": 5,
  "low":2,
  "totalFixes": 5,
  "fixes": {
    "profile": [
      {
        "issue": "Too brief; lacks measurable achievements.",
        "suggestion": "Add quantifiable results to demonstrate impact.",
        "severity": "medium"
      }
    ],
    "experience": [
      {
        "issue": "Missing employment dates.",
        "suggestion": "Add start and end dates for each position.",
        "severity": "critical"
      },{
        "issue": "Missing employment dates.",
        "suggestion": "Add start and end dates for each position.",
        "severity": "critical"
      }
    ],
    "skills": [
      {
        "issue": "List does not include role-relevant tools.",
        "suggestion": "Include tools like Docker and CI/CD.",
        "severity": "urgent"
      }
    ],
    "otherSections": {
      "patents": [
        {
          "issue": "Patent description too long.",
          "suggestion": "Summarize it in one or two lines.",
          "severity": "low"
        }
      ],
       "volunteering": [
        {
          "issue": "Patent description too long.",
          "suggestion": "Summarize it in one or two lines.",
          "severity": "low"
        }
      ]
    }
  }
}

-IMPORTANT
*place all and only those placed under custom section from your input under other sections
*For suggestions,provide fixes users that can be used directly by users in fields that require that
*In cases where a role description is provided,your analysis should be tailored to that role,if that's not provided,
your result should be based on the standard of a general resume,
*Your result should be only the object,no explanations or comments or anything else
`
export const scorePrompt = `You are an expert typescript programmer and expert resume scorer.
Your scores should be based on the analysis object and the extracted resume object that's been provided
Score the resume based on completeness, relevance, and quality of information. 
Your scores should be an object,this is the interface of your result
interface ResumeScore {
  scores: {
    profile?: number;
    education?: number;
    experience?: number;
    projects?: number;
    skills?: number;
    certifications?: number;
    awards?: number;
    publications?: number;
    overallScore: number;
  };
  customSections?: {
    sectionName: string;
    score: number;
    remarks: string;
  }[];
  roleMatch?: {
    targetRole: string;
    matchPercentage: number;
    missingSkills: string[];
    recommendations: string[];
  };
}

--examples of the results you are to provide
# example 1
{"scores": {
    "profile": 8.5,
    "education": 9.0,
    "experience": 8.0,
    "projects": 9.5,
    "skills": 8.8,
    "certifications": 7.0,
    "awards": 6.5,
    "publications": 7.5,
    "overallScore": 8.3
  },
  "customSections": [
    {
      "sectionName": "Volunteering",
      "score": 8.0,
      "remarks": "Strong community involvement, shows leadership."
    },
    {
      "sectionName": "Hobbies",
      "score": 6.0,
      "remarks": "Only marginally relevant to target job."
    }
  ],
  "roleMatch": {
    "targetRole": "Software Engineer",
    "matchPercentage": 85,
    "missingSkills": ["Kubernetes", "CI/CD Pipelines"],
    "recommendations": [
      "Include DevOps-related work or certifications."
    ]
  }
}

# example 2
{"scores": {
    "profile": 8.5,
    "education": 9.0,
    "experience": 8.0,
    "projects": 9.5,
    "skills": 8.8,
    "certifications": 7.0,
    "awards": 6.5,
    "publications": 7.5,
    "overallScore": 8.3
  },
  "customSections": [
    {
      "sectionName": "Volunteering",
      "score": 8.0,
      "remarks": "Strong community involvement, shows leadership."
    },
    {
      "sectionName": "Hobbies",
      "score": 6.0,
      "remarks": "Only marginally relevant to target job."
    }
  ],
  "roleMatch": {
    "targetRole": "Python Engineer",
    "matchPercentage": 90,
    "missingSkills": ["Kubernetes", "CI/CD Pipelines"],
    "recommendations": [
      "Include DevOps-related work or certifications."
    ]
  }
}
--IMPORTANT
*If no role description is provided in your input,it means your scores should be based on the
standard of a general resume but if a role is found it means your scores should be tailored
to the role
*In cases where no targetted is provided don't add the roleMatch section in your result
*Your result should only be the object and nothing else,no comment,no explanation
`
