import Link from 'next/link'
import type {NAV_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from './sanity-image'
import {NavLink} from './nav-link'

type NavData = NonNullable<NAV_QUERY_RESULT>

const SOCIAL_PLATFORMS: Array<{key: keyof NonNullable<NavData['socialLinks']>; label: string}> = [
  {key: 'twitter', label: 'X / Twitter'},
  {key: 'linkedin', label: 'LinkedIn'},
  {key: 'youtube', label: 'YouTube'},
  {key: 'instagram', label: 'Instagram'},
  {key: 'mastodon', label: 'Mastodon'},
]

export function Footer({data}: {data: NavData}) {
  const year = new Date().getFullYear()
  const socialLinks = data.socialLinks
    ? SOCIAL_PLATFORMS.filter(
        (p) => data.socialLinks?.[p.key],
      ).map((p) => ({label: p.label, href: data.socialLinks![p.key]!}))
    : []

  return (
    <footer className="border-t border-border bg-surface-alt">
      <div className="mx-auto grid max-w-content-max gap-8 px-6 lg:px-8 py-12 sm:grid-cols-3">
        {/* Brand column */}
        <div>
          <Link href="/" aria-label="Homepage" className="inline-flex items-center gap-2">
            {data.logo ? (
              <SanityImage value={data.logo} width={32} height={32} className="h-6 w-auto" />
            ) : (
              <span className="text-lg font-semibold">{data.name}</span>
            )}
          </Link>
          {data.tagline && (
            <p className="mt-3 max-w-[32ch] text-sm text-pretty text-text-muted">{data.tagline}</p>
          )}
        </div>

        {/* Navigation column */}
        {data.footerNav && data.footerNav.length > 0 && (
          <nav aria-label="Footer navigation">
            <p className="text-sm font-semibold text-text-primary">Navigate</p>
            <ul className="mt-3 flex flex-col gap-2">
              {data.footerNav.map((item) => (
                <li key={item._key}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Social column */}
        {socialLinks.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-text-primary">Connect</p>
            <ul aria-label="Social links" className="mt-3 flex flex-col gap-2">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mx-auto max-w-content-max border-t border-border px-6 py-6 lg:px-8">
        <p className="text-sm text-text-muted">
          &copy; {year} {data.name ?? 'Conference'}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
