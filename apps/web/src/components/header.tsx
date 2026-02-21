import Link from 'next/link'
import type {NAV_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from './sanity-image'

type NavData = NonNullable<NAV_QUERY_RESULT>

const NAV_LINKS = [
  {href: '/schedule', label: 'Schedule'},
  {href: '/speakers', label: 'Speakers'},
  {href: '/sponsors', label: 'Sponsors'},
  {href: '/venue', label: 'Venue'},
] as const

export function Header({data}: {data: NavData}) {
  return (
    <header>
      <nav aria-label="Main navigation">
        <Link href="/" aria-label={`${data.name ?? 'Conference'} — Home`}>
          {data.logo ? (
            <SanityImage value={data.logo} width={48} height={48} />
          ) : (
            <span>{data.name}</span>
          )}
        </Link>
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
        {data.registrationUrl && (
          <a href={data.registrationUrl} target="_blank" rel="noopener noreferrer">
            {data.registrationLabel || 'Register'}
          </a>
        )}
      </nav>
    </header>
  )
}
