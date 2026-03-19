import type {NAV_QUERY_RESULT} from '@repo/sanity-queries'
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
      <div className="mx-auto flex max-w-content-wide flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
          {data.footerNav && data.footerNav.length > 0 && (
            <nav aria-label="Footer navigation">
              <ul className="flex flex-col gap-2">
                {data.footerNav.map((item) => (
                  <li key={item._key}>
                    <NavLink item={item} />
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        {socialLinks.length > 0 && (
          <ul aria-label="Social links" className="flex gap-4">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mx-auto max-w-content-wide border-t border-border px-6 py-6">
        <p className="text-sm text-text-muted">
          &copy; {year} {data.name ?? 'Conference'}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
