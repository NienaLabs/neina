import React from 'react'
import FeatureSection from './FeatureSection'

const ResumeAI = () => {
  return (
    <FeatureSection
      featureName="Resume AI"
      catchPhrase="Transform Your Resume with AI"
      description="Leverage artificial intelligence to create, optimize, and tailor your resume for maximum impact. Stand out to recruiters with a professionally crafted resume."
      bullets={[
        "AI-powered resume optimization that improves your ATS score",
        "Tailored resumes for specific job postings in seconds",
        "Real-time suggestions for better wording and impact",
        "Multiple resume templates to choose from",
        "Download in multiple formats (PDF, DOCX, etc.)",
      ]}
      media={{
        type: 'image',
        src: '/resume-ai-demo.jpg',
        alt: 'Resume AI Feature Demo',
      }}
      ctaText="Start Building Your Resume"
      ctaHref="/resume"
    />
  )
}

export default ResumeAI