import {SanityImage} from '@/components/sanity-image'
import {CtaLink} from '@/components/cta-link'

interface HeroSectionProps {
  heading: string | null
  subheading: string | null
  backgroundImage: {
    asset?: {_ref?: string; _type?: string} | null
    alt?: string | null
    hotspot?: {x?: number; y?: number} | null
    crop?: {top?: number; bottom?: number; left?: number; right?: number} | null
  } | null
  cta: {
    label: string | null
    linkType: string | null
    style: string | null
    externalUrl: string | null
    internalLink: {_type: string; slug: string | null} | null
  } | null
}

export function HeroSection({heading, subheading, backgroundImage, cta}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {backgroundImage && (
        <div className="absolute inset-0 -z-10 opacity-10">
          <SanityImage
            value={backgroundImage}
            width={1200}
            height={600}
            className="h-full w-full object-cover"
            sizes="100vw"
          />
        </div>
      )}
      <div className="mx-auto max-w-content px-6">
        {heading && <h2 className="max-w-[40ch] text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>}
        {subheading && <p className="mt-3 max-w-[48ch] text-lg text-pretty text-text-secondary">{subheading}</p>}
        {cta && (
          <div className="mt-6">
            <CtaLink cta={cta} />
          </div>
        )}
      </div>
    </section>
  )
}
