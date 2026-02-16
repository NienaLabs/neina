import * as React from "react"
import { ChevronRight, Sparkles } from "lucide-react"
import Link from 'next/link'
import Image from 'next/image'

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: {
    regular: string
    gradient: string
  }
  description?: string
  ctaText?: string
  ctaHref?: string
}

/**
 * Premium radial gradient background composed of multiple layered gradients.
 * Creates a rich, deep atmospheric effect behind the hero content.
 */
const PremiumGradientBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base layer – deep dark wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,200,0.18),transparent)]" />

      {/* Top-left accent – warm purple */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_10%_20%,rgba(147,51,234,0.12),transparent)]" />

      {/* Top-right accent – cool blue */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_85%_15%,rgba(59,130,246,0.10),transparent)]" />

      {/* Center highlight – soft lavender */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(167,139,250,0.06),transparent)]" />

      {/* Bottom fade – keeps footer transition clean */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_110%,rgba(120,80,200,0.08),transparent)]" />

      {/* Animated floating orbs for depth */}
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.07] blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[15%] w-[350px] h-[350px] rounded-full bg-blue-500/[0.06] blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[20%] left-[35%] w-[300px] h-[300px] rounded-full bg-violet-400/[0.05] blur-[100px] animate-blob animation-delay-4000" />

      {/* Dark mode enhancements */}
      <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,200,0.30),transparent)]" />
      <div className="absolute inset-0 dark:bg-[radial-gradient(circle_600px_at_10%_20%,rgba(147,51,234,0.20),transparent)]" />
      <div className="absolute inset-0 dark:bg-[radial-gradient(circle_500px_at_85%_15%,rgba(59,130,246,0.15),transparent)]" />
    </div>
  )
}

/**
 * Scrolls smoothly to the features section when invoked.
 */
const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault()
  const featuresEl = document.getElementById("features")
  if (featuresEl) {
    featuresEl.scrollIntoView({ behavior: "smooth" })
  }
}

/**
 * HeroSection – main landing page hero with premium radial gradients,
 * side-by-side layout on md+ screens, dual CTA buttons, and a floating
 * image animation with a glowing backdrop.
 */
const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      title = "Lets build your dream together",
      subtitle = {
        regular: "Achieve your career goals",
        gradient: " with AI-powered tools",
      },
      description = "Land your next role with our AI-powered tools that help you create the perfect resume, ace your interviews and match the right job.",
      ctaText = "Get Started",
      ctaHref = "/auth/sign-up",
    },
  ) => {
    return (
      <section className="relative w-full min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        {/* Premium gradient background */}
        <PremiumGradientBackground />

        {/* Decorative top-edge line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />

        {/* Main content container */}
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-16 md:py-20 md:px-8 w-full">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">

            {/* ─── Text column ─── */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              {/* Badge pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/60 dark:border-purple-500/20 bg-white/60 dark:bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Career Platform
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tighter font-geist leading-[1.1] bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
                {subtitle.regular}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">
                  {subtitle.gradient}
                </span>
              </h1>

              {/* Description */}
              <p className="max-w-lg text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {description}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start pt-2">
                {/* Primary – Get Started */}
                <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-sm font-medium backdrop-blur-3xl">
                    <Link
                      href={ctaHref}
                      className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 text-gray-900 dark:text-white border-input border hover:bg-gradient-to-tr hover:from-zinc-300/30 hover:via-purple-400/40 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/30 transition-all py-3 px-8"
                    >
                      {ctaText}
                      <ChevronRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </span>

                {/* Secondary – Learn More */}
                <a
                  href="#features"
                  onClick={scrollToFeatures}
                  className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 hover:border-purple-300/60 dark:hover:border-purple-500/30 transition-all duration-300"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>


            </div>

            {/* ─── Image column ─── */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Glowing backdrop behind the image – gives the "pop" look */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <div className="w-[80%] h-[70%] rounded-full bg-gradient-to-br from-purple-500/25 via-pink-400/15 to-blue-500/20 dark:from-purple-500/30 dark:via-pink-400/20 dark:to-blue-500/25 blur-[80px]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <div className="w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-violet-400/20 to-fuchsia-300/15 dark:from-violet-400/25 dark:to-fuchsia-300/20 blur-[60px]" />
              </div>

              {/* Floating image */}
              <Image
                src="/bobby.png"
                alt="AI Career Assistant"
                width={520}
                height={390}
                className="relative z-10 animate-hero-float drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Bottom decorative gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
      </section>
    )
  },
)
HeroSection.displayName = "HeroSection"

export { HeroSection }
