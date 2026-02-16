import FeatureSection from './FeatureSection'

const InterviewAI = () => {
  return (
    <FeatureSection
      featureName="Interview AI"
      catchPhrase="Master Your Interview Skills"
      description="Are you scared of taking interviews or have an interview coming up? Practice and refine your interviewing skills with our AI-powered voice and avatar interview coaches. Get real-time feedback and boost your confidence."
      bullets={[
        "AI-powered mock interviews based on your target role",
        "Real-time feedback on your responses",
        "Practice with various interview formats",
        "Performance analytics and improvement suggestions",
        "Real life simulation of interview with voice ai and realistic human-looking AI avatar",
      ]}
      media={{
        type: 'image',
        src: '/interview.png',
        alt: 'Interview AI Feature',
      }}
      ctaText="Start Practicing"
      ctaHref="/interview-ai"
    />
  )
}

export default InterviewAI
