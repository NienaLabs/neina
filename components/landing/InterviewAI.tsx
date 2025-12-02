import React from 'react'
import FeatureSection from './FeatureSection'

const InterviewAI = () => {
  return (
    <FeatureSection
      featureName="Interview AI"
      catchPhrase="Master Your Interview Skills"
      description="Practice and refine your interviewing skills with our AI-powered interview coach. Get real-time feedback and boost your confidence."
      bullets={[
        "AI-powered mock interviews based on your target role",
        "Real-time feedback on your responses",
        "Practice with various interview formats",
        "Performance analytics and improvement suggestions",
        "Video recording and playback for self-review",
      ]}
      media={{
        type: 'video',
        src: '/InterviewAI-Preview.mp4',
        alt: 'Interview AI Feature Demo',
      }}
      ctaText="Start Practicing"
      ctaHref="/interview-ai"
    />
  )
}

export default InterviewAI
