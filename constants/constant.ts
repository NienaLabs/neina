import {
  Blocks,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  DownloadIcon,
  Trash2
} from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,

    },
    {
      title: "Job Search",
      url: "/job-search",
      icon: Search,

    },
    {
      title: "Resume AI",
      url: "/resume",
      icon: Sparkles,
    },

    {
      title: "Interview AI",
      url: "/interview-ai",
      icon: Inbox
    },
    {
      title: "Recruiter",
      url: "/recruiters/apply",
      icon: Blocks
    },
    {
      title: "Settings",
      url: "/accounts/settings",
      icon: Settings2,
    },
    {
      title: "Support",
      url: "/support",
      icon: MessageCircleQuestion,
    },
  ],
  navSecondary: [

    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ],
}

export const resumeTags = [
  "critical",
  "urgent"
]

export const extractionData: ResumeExtraction = {
  "address": {
    "email": "example@email.com",
    "location": "Accra, Ghana",
    "telephone": "+233 123 456 789",
    "linkedInProfile": "https://linkedin.com/in/username",
    "githubProfile": "https://github.com/username",
    "portfolio": "https://portfolio.com",
    "otherLinks": ["https://medium.com/@username", "http://fuck you"]
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

export const analysisData: ResumeAnalysis = {
  "criticalFixes": 2,
  "urgentFixes": 1,
  "low": 2,
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
      }, {
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

export const scoreData: ResumeScore = {
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

export const editorButtons = [
  {
    name: "Export",
    icon: DownloadIcon,

  },
  {
    name: "Delete",
    icon: Trash2
  }
]

export const primaryResumes = [
  {
    id: '1',
    name: 'Software Engineer Resume',
    score: 88,
    isPrimary: true,
    createdAt: '2025-10-15',
    tailoredResumes: [
      {
        id: '101',
        name: 'Frontend Developer @ TechCorp',
        score: 92,
        isPrimary: false,
        createdAt: '2025-10-20',
        targetRole: 'Frontend Developer',
      },
      {
        id: '102',
        name: 'Full Stack Engineer @ Innovate Inc.',
        score: 85,
        isPrimary: false,
        createdAt: '2025-10-22',
        targetRole: 'Full Stack Engineer',
      },
    ],
  },
  {
    id: '2',
    name: 'Product Manager Resume',
    score: 94,
    isPrimary: true,
    createdAt: '2025-09-28',
    tailoredResumes: [
      {
        id: '201',
        name: 'Senior Product Manager @ Solutions Co.',
        score: 96,
        isPrimary: false,
        createdAt: '2025-10-05',
        targetRole: 'Senior Product Manager',
      },
    ],
  },
];

export const tailoredResumes = [
  {
    id: '101',
    name: 'Frontend Developer @ TechCorp',
    score: 92,
    isPrimary: false,
    createdAt: '2025-10-20',
    targetRole: 'Frontend Developer',
  },
  {
    id: '102',
    name: 'Full Stack Engineer @ Innovate Inc.',
    score: 85,
    isPrimary: false,
    createdAt: '2025-10-22',
    targetRole: 'Full Stack Engineer',
  },
  {
    id: '201',
    name: 'Senior Product Manager @ Solutions Co.',
    score: 96,
    isPrimary: false,
    createdAt: '2025-10-05',
    targetRole: 'Senior Product Manager',
  },
];