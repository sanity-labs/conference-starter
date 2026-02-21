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

  if (cta.linkType === 'internal' && cta.internalLink) {
    return <Link href={resolveInternalHref(cta.internalLink)}>{cta.label}</Link>
  }

  if (cta.externalUrl) {
    return (
      <a href={cta.externalUrl} target="_blank" rel="noopener noreferrer">
        {cta.label}
      </a>
    )
  }

  return <span>{cta.label}</span>
}
