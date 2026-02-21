import {CtaLink} from '@/components/cta-link'

interface CtaBlockSectionProps {
  heading: string | null
  body: string | null
  cta: {
    label: string | null
    linkType: string | null
    style: string | null
    externalUrl: string | null
    internalLink: {_type: string; slug: string | null} | null
  } | null
}

export function CtaBlockSection({heading, body, cta}: CtaBlockSectionProps) {
  return (
    <section>
      {heading && <h2>{heading}</h2>}
      {body && <p>{body}</p>}
      <CtaLink cta={cta} />
    </section>
  )
}
