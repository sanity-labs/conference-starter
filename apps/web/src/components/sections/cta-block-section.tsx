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
    <section className="mx-auto max-w-content px-6 py-12">
      <div className="rounded-lg border border-border bg-surface-alt p-8 text-center sm:p-12">
        {heading && <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>}
        {body && <p className="mt-3 text-text-secondary">{body}</p>}
        {cta && (
          <div className="mt-6">
            <CtaLink cta={cta} />
          </div>
        )}
      </div>
    </section>
  )
}
