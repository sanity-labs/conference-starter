import Link from 'next/link'
import type {NAV_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from './sanity-image'
import {NavLink} from './nav-link'

type NavData = NonNullable<NAV_QUERY_RESULT>

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
        {data.headerNav && data.headerNav.length > 0 && (
          <ul>
            {data.headerNav.map((item) => (
              <li key={item._key}>
                <NavLink item={item} />
              </li>
            ))}
          </ul>
        )}
        {data.registrationUrl && (
          <a href={data.registrationUrl} target="_blank" rel="noopener noreferrer">
            {data.registrationLabel || 'Register'}
          </a>
        )}
      </nav>
    </header>
  )
}
