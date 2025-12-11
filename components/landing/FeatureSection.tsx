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
        <div className={`grid grid-cols-1 md:grid-cols-2  gap-8 md:gap-12 items-center ${reversed ? 'md:flex md:flex-row-reverse justify-around' : ''}`}>
          {/* Media */}
          <div className={" relative h-[400] w-[300] place-self-center flex items-center"}>
            {media.type === 'image' ? (
                <Image
                  src={media.src}
                  alt={media.alt || featureName}
                  fill
                  unoptimized={featureName==="Job Search"}
                />
            ) : (
              <video
                src={media.src}
                autoPlay
                loop
                muted
                className="w-full rounded-xl border border-white/10 shadow-2xl"
              />
            )}
          </div>

          {/* Features & CTA */}
          <div className="flex flex-col">
            {/* Bullets */}
            <TextMask animateOnScroll>
            <ul className="space-y-4 bg-white p-2 border rounded-lg mb-8">
              {bullets.map((bullet, index) => (
                <li
                  key={index}
                  className="flex  items-start gap-3"
                >
                  <div className="shrink-0 w-6 h-6 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-base leading-relaxed">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
            </TextMask>

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
