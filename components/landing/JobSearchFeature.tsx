import React from 'react'
import FeatureSection from './FeatureSection'

const JobSearch = () => {
  return (
    <FeatureSection
      featureName="Job Search"
      catchPhrase="Find Your Perfect Role"
      description="Tired of finding jobs?, say no more discover job opportunities that align with your skills and career goals. Our intelligent matching algorithm finds positions where you'll thrive."
      bullets={[
        "AI-powered job matching based on your profile and skills",
        "Real-time job recommendations tailored to you",
        "Advanced filtering by location, industry, and salary",
        "One-click application process",
        "Track your applications and interview progress",
      ]}
      media={{
        type: 'image',
        src: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2000&auto=format&fit=crop',
        alt: 'Job Search Feature Demo',
      }}
      ctaText="Explore Job Opportunities"
      ctaHref="/job-search"
      reversed
    />
  )
}

export default JobSearch
