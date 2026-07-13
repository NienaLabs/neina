"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star,ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import TextMask from '@/components/text-mask'
import { cn } from '@/lib/utils'

interface FeatureSectionProps {
  featureName: string
  catchPhrase: string
  description: string
  bullets: string[]
  media: {
    type: 'image' | 'video'
    src: string
    alt?: string
  }
  ctaText: string
  ctaHref: string
  reversed?: boolean
}

const cloudD = `
  M 320 40
  C 400 40 470 80 500 130
  C 580 140 620 200 610 270
  C 610 350 550 420 470 440
  C 440 500 350 520 260 480
  C 200 510 100 480 80 410
  C 30 380 20 310 40 250
  C 10 170 60 110 140 100
  C 180 50 250 30 320 40
  Z
`;

const cloudSvgEncoded = encodeURIComponent(`<svg viewBox="0 0 640 540" xmlns="http://www.w3.org/2000/svg"><path d="${cloudD}" fill="black"/></svg>`);
const maskStyle = {
  WebkitMaskImage: `url("data:image/svg+xml;utf8,${cloudSvgEncoded}")`,
  WebkitMaskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskImage: `url("data:image/svg+xml;utf8,${cloudSvgEncoded}")`,
  maskSize: 'contain',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
};

const FeatureSection = ({
  featureName,
  catchPhrase,
  description,
  bullets,
  media,
  ctaText,
  ctaHref,
  reversed = false,
}: FeatureSectionProps) => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 relative z-10">
      <div className="max-w-6xl">
        {/* Title with Badge */}
        <div className="mb-12 bg-indigo-100 border p-2 rounded-lg w-fit">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {featureName}
          </h2>
          <Badge variant="secondary" className="flex items-center gap-2 w-fit">
            <Star className="w-4 h-4" />
            {catchPhrase}
          </Badge>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
            {description}
          </p>
        </div>

        {/* Content Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2  gap-0 md:gap-12 items-center ${reversed ? 'md:flex md:flex-row-reverse justify-around' : ''}`}>
          {/* Media */}
          <div className="relative place-self-center flex items-center justify-center w-full max-w-[500px] aspect-[640/540] drop-shadow-2xl">
            <div 
              className="absolute inset-0 w-full h-full"
              style={maskStyle}
            >
              {media.type === 'image' ? (
                  <Image
                    src={media.src}
                    alt={media.alt || featureName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
              ) : (
                <video
                  src={media.src}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Optional decorative SVG stroke overlay */}
            <svg viewBox="0 0 640 540" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xl" aria-hidden="true">
              <path d={cloudD} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="4" />
            </svg>
          </div>

          {/* Features & CTA */}
          <div className="flex flex-col">
            {/* Bullets */}
            <ul className="space-y-4 premium-glow premium-glow-white p-6 rounded-xl mb-8">
              {bullets.map((bullet, index) => (
                <li
                  key={index}
                  className="flex  items-start gap-3"
                >
                  <div className="shrink-0 w-6 h-6 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TextMask animateOnScroll delay={index * 0.1}>
                      <p className="text-base leading-relaxed">
                        {bullet}
                      </p>
                    </TextMask>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button
              asChild
              className="w-fit px-8 py-3  hover:opacity-90 transition-opacity rounded-full text-white font-semibold text-base"
            >
              <Link href={ctaHref}>
                {ctaText}
              <ExternalLink/>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
