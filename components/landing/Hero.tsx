"use client"
import * as React from "react"
import { useRef, useEffect } from "react"
import { ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// ─── Unique IDs for SVG clip/mask elements ───────────────────────────────────

/**
 * Renders the cloud SVG <path> used as both the visible shape and clip mask.
 */
const cloudD = `
  M 260 80
  C 200 80 160 110 155 155
  C 110 155 75 185 75 225
  C 75 268 108 300 152 300
  L 370 300
  C 412 300 445 268 445 228
  C 445 192 420 163 388 157
  C 385 112 345 80 300 80
  C 288 80 273 83 260 88
  Z
`

/**
 * HeroSection – Immersive cloud-masked hero with GSAP scroll-driven
 * zoom reveal. On scroll the cloud zooms into the full-page image,
 * a white gradient overlay fades in, then the Demo section slides in on top.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const cloudDecorRef = useRef<SVGSVGElement>(null)
  const imageMaskRef = useRef<SVGSVGElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const textTopRef = useRef<HTMLDivElement>(null)
  const textBottomRef = useRef<HTMLDivElement>(null)
  const statsLeftRef = useRef<HTMLDivElement>(null)
  const statsRightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=250%",
          scrub: 1.2,
          pin: stickyRef.current,
          pinSpacing: true,
          anticipatePin: 1,
        },
      })

      // Phase 1: text & stats fade away
      tl.to(
        [textTopRef.current, statsLeftRef.current, statsRightRef.current],
        { opacity: 0, y: -50, ease: "power2.in", duration: 0.35 },
        0
      )
      tl.to(
        textBottomRef.current,
        { opacity: 0, y: 60, ease: "power2.in", duration: 0.35 },
        0
      )

      // Phase 2: cloud/image SVG zooms to fill viewport
      tl.to(
        imageMaskRef.current,
        {
          scale: 30,
          transformOrigin: "50% 50%",
          ease: "power2.inOut",
          duration: 0.7,
        },
        0.15
      )

      // Decorative cloud outline fades out
      tl.to(
        cloudDecorRef.current,
        { opacity: 0, ease: "power2.in", duration: 0.25 },
        0.15
      )

      // Phase 3: white overlay fades in
      tl.to(
        overlayRef.current,
        { opacity: 1, ease: "power1.in", duration: 0.3 },
        0.7
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "300svh" }}
    >
      {/* ── Sticky viewport ── */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-svh overflow-hidden bg-white"
      >
        {/* Subtle purple haze at top */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(139,92,246,0.08) 0%, transparent 65%)",
          }}
        />

        {/* ══════════════════════════════════════════════════
            BACKGROUND IMAGE (revealed by scroll)
        ══════════════════════════════════════════════════ */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80&fit=crop"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ══════════════════════════════════════════════════
            CLOUD MASK (centre of viewport, zooms on scroll)
        ══════════════════════════════════════════════════ */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Decorative outer glow rings – fade on scroll */}
          <svg
            ref={cloudDecorRef}
            viewBox="0 0 480 340"
            width="530"
            height="375"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute z-10"
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {/* Wide soft glow */}
            <path d={cloudD} fill="none" stroke="rgba(139,92,246,0.18)" strokeWidth="40" strokeLinejoin="round" />
            {/* Dashed accent */}
            <path d={cloudD} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeDasharray="7 11" strokeLinejoin="round" />
          </svg>

          {/* SVG mask that zooms to reveal the background image */}
          <svg
            ref={imageMaskRef}
            viewBox="0 0 480 340"
            width="480"
            height="340"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible", transformOrigin: "center" }}
            aria-hidden="true"
            className="z-10"
          >
            <defs>
              <mask id="hole-mask">
                {/* White background to make the mask opaque outside the cloud */}
                <rect x="-4000" y="-4000" width="9000" height="9000" fill="white" />
                {/* Black cloud to create a transparent hole */}
                <path d={cloudD} fill="black" />
              </mask>
            </defs>

            {/* The white overlay that hides the image, with a hole in the middle */}
            <rect
              x="-4000"
              y="-4000"
              width="9000"
              height="9000"
              fill="white"
              mask="url(#hole-mask)"
            />

            {/* Inner rim highlights */}
            <path
              d={cloudD}
              fill="none"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="8"
            />
            <path
              d={cloudD}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* ══════════════════════════════════════════════════
            WHITE OVERLAY (reveals on scroll end)
        ══════════════════════════════════════════════════ */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, #ffffff 100%)",
          }}
          aria-hidden="true"
        />

        {/* ══════════════════════════════════════════════════
            TEXT CONTENT WRAPPER
        ══════════════════════════════════════════════════ */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20 pb-8 md:pb-12 pt-20 md:pt-28">
          {/* TEXT – TOP (badge + headline) */}
          <div
            ref={textTopRef}
            className="flex flex-col items-center px-4 text-center pointer-events-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm mb-6 md:mb-7">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Career Platform
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.04] max-w-3xl"
              style={{
                background:
                  "linear-gradient(180deg, #0f0f0f 0%, rgba(15,15,15,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Achieve your career{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                goals
              </span>
            </h1>
          </div>

          {/* TEXT – BOTTOM (CTAs + description) */}
          <div
            ref={textBottomRef}
            className="flex flex-col items-center px-4 text-center pointer-events-auto"
          >
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 md:mb-8">
              <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                <span className="absolute inset-[-1000%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#7c3aed_50%,#E2CBFF_100%)]" />
                <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white text-sm font-semibold backdrop-blur-3xl">
                  <Link
                    href="/auth/sign-up"
                    id="hero-cta-primary"
                    className="inline-flex rounded-full items-center gap-2 bg-gradient-to-tr from-violet-50 via-purple-100/60 to-transparent text-gray-900 border border-violet-200/60 hover:bg-violet-100/80 transition-all py-3 px-8 group"
                  >
                    Get Started Free
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </span>

              <a
                href="#features"
                id="hero-cta-secondary"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium text-gray-600 border border-gray-200 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-violet-200 hover:text-violet-700 transition-all duration-300"
              >
                Watch Demo
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <p className="text-base md:text-lg text-gray-600 max-w-md leading-relaxed font-medium">
              Land your next role with AI tools that craft the perfect resume, coach
              you through interviews, and surface the right opportunities.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            FLOATING STAT PILLS
        ══════════════════════════════════════════════════ */}
        <div
          ref={statsLeftRef}
          className="absolute left-[5%] top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-20"
          aria-label="Platform statistics"
        >
          {[
            { value: "98%", label: "Interview success" },
            { value: "3.2×", label: "Faster placement" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/90 backdrop-blur-md border border-violet-100 shadow-lg rounded-2xl px-5 py-4 text-center"
            >
              <div className="text-2xl font-bold text-violet-700">{stat.value}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">{stat.label}</div>
            </div>
          ))}
        </div>

        <div
          ref={statsRightRef}
          className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-20"
          aria-label="Platform statistics"
        >
          {[
            { value: "50k+", label: "Careers launched" },
            { value: "4.9★", label: "User rating" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/90 backdrop-blur-md border border-violet-100 shadow-lg rounded-2xl px-5 py-4 text-center"
            >
              <div className="text-2xl font-bold text-violet-700">{stat.value}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
