import Link from 'next/link'
import type {NAV_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from './sanity-image'
import {NavLink} from './nav-link'
import {MobileNav} from './mobile-nav'

type NavData = NonNullable<NAV_QUERY_RESULT>

export function Header({data}: {data: NavData}) {
  const navItems = data.headerNav && data.headerNav.length > 0 ? data.headerNav : null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex max-w-content-max items-center justify-between px-6 py-3 lg:px-8"
      >
        <Link
          href="/"
          aria-label={`${data.name ?? 'Conference'} — Home`}
          className="flex items-center gap-2"
        >
          {data.logo ? (
            <SanityImage value={data.logo} width={48} height={48} />
          ) : (
            <span className="text-lg font-semibold">{data.name}</span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          {navItems && (
            <ul className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <li key={item._key}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          )}
          {data.registrationUrl && (
            <a
              href={data.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary hidden sm:inline-flex"
            >
              {data.registrationLabel || 'Register'}
            </a>
          )}
          <MobileNav>
            {navItems && (
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item._key}>
                    <NavLink item={item} />
                  </li>
                ))}
              </ul>
            )}
            {data.registrationUrl && (
              <a
                href={data.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-4 w-full"
              >
                {data.registrationLabel || 'Register'}
              </a>
            )}
          </MobileNav>
        </div>
      </nav>
    </header>
  )
}
