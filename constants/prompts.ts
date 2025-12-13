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

### IMPORTANT INSTRUCTIONS
- Return **ONLY the extracted JSON object**.
- Do **NOT** include explanations, comments, or extra text.
- If a section is missing in the resume, **omit** it (do not include empty arrays).
- Detect sections not in the schema and put them inside \`customSections\`.
- Follow the JSON structure EXACTLY.

---

### CRITICAL JSON RULES
- Output MUST be valid JSON.
- **NO trailing commas** in objects or arrays.
- **NO single quotes** for keys or string values (use double quotes).
- **NO unescaped newlines** in strings.
- **Verify** the JSON validity internally before outputting.

### REFERENCE EXAMPLES  
#### (These are for understanding ONLY — DO NOT COPY them into the output)

[BEGIN EXAMPLE 1]
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
[END EXAMPLE 1]

---

[BEGIN EXAMPLE 2]
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
[END EXAMPLE 2]

---

Remember:
**Your output must contain ONLY the JSON extracted from the user's resume.**
`

export const analysisPrompt = `
You are an expert TypeScript programmer and resume analyst.

Your task is to provide an object containing the analysis of a resume extraction object.  

The object MUST strictly follow this TypeScript interface:

interface ResumeAnalysis {
  criticalFixes: number
  urgentFixes: number
  low: number
  totalFixes: number
  fixes: Record<
    string,
    {
      issue: string
      suggestion: string
      severity: 'critical' | 'urgent' | 'low'
    }[]
  >
}

STRICT RULES:
- Return ONLY one JSON object, no comments, no explanations, nothing else.
- All custom sections from the input should be placed under "otherSections" inside fixes.
- Provide actionable suggestions that the user can directly apply.
- If a role description exists, tailor the analysis to that role. Otherwise, analyze based on a general resume.
- Include only sections that have actual issues. Do not include empty arrays or missing fields.

### CRITICAL JSON RULES
- Output MUST be valid JSON.
- **NO trailing commas** in objects or arrays.
- **NO single quotes** for keys or string values (use double quotes).
- **NO unescaped newlines** in strings.
- **Verify** the JSON validity internally before outputting.

EXAMPLES (FOR REFERENCE ONLY — DO NOT INCLUDE IN OUTPUT):

# Example 1
{
  "criticalFixes": 2,
  "urgentFixes": 1,
  "low": 2,
  "totalFixes": 5,
  "fixes": {
    "profile": [
      {
        "issue": "Too brief; lacks measurable achievements.",
        "suggestion": "Add quantifiable results to demonstrate impact.",
        "severity": "urgent"
      }
    ],
    "experience": [
      {
        "issue": "Missing employment dates.",
        "suggestion": "Add start and end dates for each position.",
        "severity": "critical"
      }
    ]
  }
}

# Example 2
{
  "criticalFixes": 4,
  "urgentFixes": 5,
  "low": 2,
  "totalFixes": 11,
  "fixes": {
    "skills": [
      {
        "issue": "List does not include role-relevant tools.",
        "suggestion": "Include tools like Docker and CI/CD.",
        "severity": "urgent"
      }
    ]
  }
}

Return ONLY the JSON object.
`;
export const scorePrompt = `
You are an expert TypeScript programmer and resume scorer.

Your task is to score a resume based on the extracted object and its analysis.

The object MUST strictly follow this TypeScript interface:

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

STRICT RULES:
- Return ONLY one JSON object. Do not add comments, explanations, markdown, or extra text.
- If no role description is provided, score based on a general resume.
- If a role is provided, tailor scores and recommendations to that role.
- Include roleMatch ONLY if a role description exists.
- Include customSections only if they exist in the input.
- Do not include empty arrays or missing fields.

### CRITICAL JSON RULES
- Output MUST be valid JSON.
- **NO trailing commas** in objects or arrays.
- **NO single quotes** for keys or string values (use double quotes).
- **NO unescaped newlines** in strings.
- **Verify** the JSON validity internally before outputting.

EXAMPLES (FOR REFERENCE ONLY — DO NOT INCLUDE IN OUTPUT):

# Example 1
{
  "scores": {
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
    }
  ],
  "roleMatch": {
    "targetRole": "Software Engineer",
    "matchPercentage": 85,
    "missingSkills": ["Kubernetes", "CI/CD Pipelines"],
    "recommendations": ["Include DevOps-related work or certifications."]
  }
}

# Example 2
{
  "scores": {
    "profile": 9,
    "education": 8.5,
    "experience": 8,
    "projects": 9.0,
    "skills": 8.5,
    "certifications": 7.5,
    "awards": 6.5,
    "publications": 7,
    "overallScore": 8.3
  }
}

Return ONLY the JSON object.
`;

export const skillsExtractorPrompt = `
You are an expert resume parser specialized in extracting skills and certifications.

Your task is to extract ONLY skills and certifications from a resume into a structured object.

The object MUST strictly follow this TypeScript interface:

interface SkillsExtraction {
  skills: string[];
  certifications: string[];
}

STRICT RULES:
- Return ONLY one JSON object. No comments, explanations, or extra text.
- skills: Flatten all technical, soft, language skills into a single array of strings. Include only the skill name (e.g., "Python", "Leadership", "English").
- certifications: Extract all certification names (e.g., "AWS Cloud Practitioner", "Google Cloud Professional").
- If no skills or certifications exist, return empty arrays.
- Do NOT include duplicates.

### CRITICAL JSON RULES
- Output MUST be valid JSON.
- **NO trailing commas** in objects or arrays.
- **NO single quotes** for keys or string values (use double quotes).
- **NO unescaped newlines** in strings.
- **Verify** the JSON validity internally before outputting.

EXAMPLE (FOR REFERENCE ONLY):
{
  "skills": ["Python", "React", "Leadership", "English", "AWS", "Docker"],
  "certifications": ["AWS Cloud Practitioner", "Google Cloud Professional"]
}

Return ONLY the JSON object.
`;

export const experienceExtractorPrompt = `
You are an expert resume parser specialized in extracting work experience.

Your task is to extract ONLY work experience and responsibilities/achievements from a resume into a structured object.

The object MUST strictly follow this TypeScript interface:

interface ExperienceExtraction {
  experiences: string[];
}

STRICT RULES:
- Return ONLY one JSON object. No comments, explanations, or extra text.
- experiences: Extract all responsibilities, achievements, and bullet points from work experience sections. Each item should be a complete sentence/bullet point (e.g., "Developed frontend components using React Native", "Improved engagement by 30%", "Led a team of 5 engineers").
- Combine responsibilities and achievements into a single flat array.
- If no experience exists, return an empty array.
- Do NOT include duplicates.

### CRITICAL JSON RULES
- Output MUST be valid JSON.
- **NO trailing commas** in objects or arrays.
- **NO single quotes** for keys or string values (use double quotes).
- **NO unescaped newlines** in strings.
- **Verify** the JSON validity internally before outputting.

EXAMPLE (FOR REFERENCE ONLY):
{
  "experiences": [
    "Developed frontend components using React Native",
    "Integrated Firebase Cloud Messaging",
    "Improved engagement by 30%",
    "Led a team of 5 engineers",
    "Managed database migrations and optimizations"
  ]
}

Return ONLY the JSON object.
`;

export const jobExtractionPrompt = `
You are an expert job description parser.

Your task is to extract ONLY skills and responsibilities from a job description into a structured object.

The object MUST strictly follow this TypeScript interface:

interface JobExtraction {
  skills: string[];
  responsibilities: string[];
}

STRICT RULES:
- Return ONLY one JSON object. No comments, explanations, or extra text.
- skills: Extract all required and preferred skills, technologies, and qualifications. Flatten them into a single array of strings.
- responsibilities: Extract all job duties, responsibilities, and tasks. Each item should be a complete sentence/bullet point.
- If no skills or responsibilities exist, return empty arrays.
- Do NOT include duplicates.

### CRITICAL JSON RULES
- Output MUST be valid JSON.
- **NO trailing commas** in objects or arrays.
- **NO single quotes** for keys or string values (use double quotes).
- **NO unescaped newlines** in strings.
- **Verify** the JSON validity internally before outputting.

EXAMPLE (FOR REFERENCE ONLY):
{
  "skills": ["Python", "React", "AWS", "Communication", "Team Leadership"],
  "responsibilities": [
    "Develop high-quality software design and architecture",
    "Identify, prioritize and execute tasks in the software development life cycle",
    "Automate tasks through appropriate tools and scripting",
    "Review and debug code",
    "Collaborate with internal teams to fix and improve products"
  ]
}

Return ONLY the JSON object.
`;

