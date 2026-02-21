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
    <section>
      {backgroundImage && (
        <SanityImage value={backgroundImage} width={1200} height={600} />
      )}
      {heading && <h2>{heading}</h2>}
      {subheading && <p>{subheading}</p>}
      <CtaLink cta={cta} />
    </section>
  )
}
