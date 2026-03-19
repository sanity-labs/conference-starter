import Link from 'next/link'

interface CtaData {
  label: string | null
  linkType: string | null
  style: string | null
  externalUrl: string | null
  internalLink: {_type: string; slug: string | null} | null
}

function resolveInternalHref(link: {_type: string; slug: string | null}): string {
  const slug = link.slug ?? ''
  switch (link._type) {
    case 'page':
      return `/${slug}`
    case 'session':
      return `/sessions/${slug}`
    case 'speaker':
      return `/speakers/${slug}`
    default:
      return `/${slug}`
  }
}

export function CtaLink({cta}: {cta: CtaData | null}) {
  if (!cta?.label) return null

  const className =
    cta.style === 'primary' ? 'btn btn-primary' : 'btn btn-secondary'

  if (cta.linkType === 'internal' && cta.internalLink) {
    return (
      <Link href={resolveInternalHref(cta.internalLink)} className={className}>
        {cta.label}
      </Link>
    )
  }

  if (cta.externalUrl) {
    return (
      <a href={cta.externalUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {cta.label}
      </a>
    )
  }

  return <span className={className}>{cta.label}</span>
}
