import Link from 'next/link'

const ROUTE_LABELS: Record<string, string> = {
  '/schedule': 'Schedule',
  '/speakers': 'Speakers',
  '/sessions': 'Sessions',
  '/sponsors': 'Sponsors',
  '/venue': 'Venue',
  '/cfp': 'Call for Papers',
  '/announcements': 'Announcements',
  '/faq': 'FAQ',
}

interface NavItemData {
  _key: string
  title: string | null
  linkType: string | null
  route: string | null
  url: string | null
  page: {_type: string; title: string | null; slug: string | null} | null
}

function resolvePageHref(page: {_type: string; slug: string | null}): string {
  const slug = page.slug ?? ''
  switch (page._type) {
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

function resolveNavItem(item: NavItemData): {href: string; label: string; external: boolean} | null {
  switch (item.linkType) {
    case 'route': {
      if (!item.route) return null
      return {
        href: item.route,
        label: item.title || ROUTE_LABELS[item.route] || item.route,
        external: false,
      }
    }
    case 'page': {
      if (!item.page) return null
      return {
        href: resolvePageHref(item.page),
        label: item.title || item.page.title || 'Untitled',
        external: false,
      }
    }
    case 'external': {
      if (!item.url) return null
      return {
        href: item.url,
        label: item.title || item.url,
        external: true,
      }
    }
    default:
      return null
  }
}

export function NavLink({item}: {item: NavItemData}) {
  const resolved = resolveNavItem(item)
  if (!resolved) return null

  const className =
    'inline-flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary'

  if (resolved.external) {
    return (
      <a href={resolved.href} target="_blank" rel="noopener noreferrer" className={className}>
        {resolved.label}
      </a>
    )
  }

  return (
    <Link href={resolved.href} className={className}>
      {resolved.label}
    </Link>
  )
}
