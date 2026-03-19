import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {ANNOUNCEMENTS_QUERY} from '@repo/sanity-queries'

export const metadata: Metadata = {
  title: 'Announcements',
  description: 'Latest news and updates from Everything NYC 2026.',
}

export default function AnnouncementsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Announcements</h1>
      <Suspense>
        <AnnouncementsListDynamic />
      </Suspense>
    </main>
  )
}

async function AnnouncementsListDynamic() {
  const opts = await getDynamicFetchOptions()
  return <AnnouncementsListCached {...opts} />
}

async function AnnouncementsListCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: announcements} = await sanityFetch({
    query: ANNOUNCEMENTS_QUERY,
    perspective,
    stega,
  })

  if (!announcements || announcements.length === 0) {
    return <p className="mt-8 text-text-muted">No announcements yet.</p>
  }

  return (
    <ul className="mt-8 divide-y divide-border" aria-label="Announcements">
      {announcements.map((item) => (
        <li key={item._id} className="py-6 first:pt-0">
          <article>
            <Link href={`/announcements/${item.slug}`} className="group">
              <h2 className="text-xl font-semibold group-hover:underline">{item.title}</h2>
            </Link>
            {item.publishedAt && (
              <time dateTime={item.publishedAt} className="mt-1 block text-sm text-text-muted">
                {new Date(item.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'America/New_York',
                })}
              </time>
            )}
            {item.body && (
              <p className="mt-2 text-text-secondary">
                {item.body.length > 200 ? `${item.body.slice(0, 200)}…` : item.body}
              </p>
            )}
          </article>
        </li>
      ))}
    </ul>
  )
}
