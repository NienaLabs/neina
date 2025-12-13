'use client'
import Features from './Features'
import FeatureCards from './FeatureCards'
import { TestimonialDemo as Testimonials } from './Testimonials'
import HowItWorks from './HowItWorks'
import FAQ from './FAQ'
import Footer from './Footer'
import Header from './Header'
import InterviewAI from './InterviewAI'
import ResumeAI from './ResumeAI'
import JobSearchFeature from './JobSearchFeature'
import { ReactLenis } from 'lenis/react'
import gsap from 'gsap'
import { useEffect, useRef} from 'react'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useGSAP} from '@gsap/react'
import {HeroSection} from './Hero'
import HowWeHelp from './HowWeHelp'

gsap.registerPlugin(ScrollTrigger);


export default function LandingPage() {
  const lenisRef = useRef()
  
 

  useEffect(() => {
    function update(time) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }
  
    gsap.ticker.add(update)
  
    return () => gsap.ticker.remove(update)
  }, [])
  useGSAP(()=>{
    const path = document.querySelector("#stroke-path") as SVGPathElement | null
    if (!path) return
     const pathLength = path.getTotalLength()
    // Set dasharray to length (creates pattern of [length, length] basically)
    path.style.strokeDasharray = `${pathLength}`
    // Set offset to -length. This means the visible part is shifted back by one full length.
    // Effectively, we are looking at the 'gap' before the start.
    path.style.strokeDashoffset = `${-pathLength}`
    path.style.willChange = "stroke-dashoffset" // Optimize animation performance

    gsap.to(path, {
      strokeDashoffset: 0, 
      ease:"none",
      scrollTrigger:{
        trigger:"#feature-svg",
        start:"top center",
        end:"bottom bottom",
        scrub:true
      }
    })
  })

  

  return (
    <>
      <ReactLenis root options={{ 
        autoRaf: false ,
      }} ref={lenisRef}/>

      <div className="flex overflow-hidden min-h-screen flex-col bg-white dark:bg-gray-900">
        <Header/>
        <HeroSection/>
        <HowWeHelp/>
        <FeatureCards />
        <Features />
        <div id="features-container" className="relative h-full  w-full overflow-hidden">
        <div className="svg-path w-full h-full">
      <svg id="feature-svg" className="w-full h-full" preserveAspectRatio="xMidYMid slice" width="525" height="1238" viewBox="0 0 525 1238" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_di_15_2)">
<path id="stroke-path" d="M258.593 1179.01C243.967 1151.74 231.806 1104.87 234.648 1030.01C240.127 885.687 381.93 809.129 415.648 1005.01C256.345 1120.34 -32.7743 876.492 79.6483 699.008C192.071 521.524 546.877 479.167 455.648 634.008C364.42 788.849 287.675 613.294 249.648 481.008C211.621 348.721 339.648 276.008 363.648 364.008C387.648 452.008 14.6483 395.008 71.6483 270.008C128.648 145.008 280.166 96.294 357.648 50.0077" stroke="#4C14BD" stroke-width="100" stroke-linecap="round" shape-rendering="crispEdges"/>
</g>
<defs>
<filter id="filter0_di_15_2" x="0" y="0" width="524.486" height="1237.02" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.217128 0 0 0 0 0.209648 0 0 0 0 0.658483 0 0 0 0.38 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_15_2"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_15_2" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect2_innerShadow_15_2"/>
</filter>
</defs>
</svg>
        </div>
        <ResumeAI/>
        <JobSearchFeature/>
        <InterviewAI/>
        </div>
        <Testimonials />
        <HowItWorks />
        <FAQ />
        <Footer />
      </div>
    </>
  )
}
