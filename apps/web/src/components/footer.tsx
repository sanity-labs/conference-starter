import Link from 'next/link'
import type {NAV_QUERY_RESULT} from '@repo/sanity-queries'

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
    <footer>
      <nav aria-label="Footer navigation">
        <ul>
          {data.pages?.map((page) => (
            <li key={page._id}>
              <Link href={`/${page.slug}`}>{page.title}</Link>
            </li>
          ))}
          <li>
            <Link href="/cfp">Call for Papers</Link>
          </li>
          <li>
            <Link href="/announcements">Announcements</Link>
          </li>
        </ul>
      </nav>
      {socialLinks.length > 0 && (
        <ul aria-label="Social links">
          {socialLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p>
        &copy; {year} {data.name ?? 'Conference'}. All rights reserved.
      </p>
    </footer>
  )
}
