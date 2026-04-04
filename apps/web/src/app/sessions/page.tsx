import {Suspense} from 'react'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {SESSIONS_LISTING_QUERY} from '@repo/sanity-queries'
import type {SESSIONS_LISTING_QUERY_RESULT} from '@repo/sanity-queries'
import {createMetadata} from '@/lib/metadata'
import {SessionFilters} from './session-filters'

export const metadata = createMetadata({
  title: 'Sessions',
  description:
    'Browse all sessions — filter by track, type, or level to find the talks and workshops for you.',
  path: '/sessions',
})

export default function SessionsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-max px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Sessions</h1>
      <Suspense>
        <SessionsListDynamic />
      </Suspense>
    </main>
  )
}

async function SessionsListDynamic() {
  const opts = await getDynamicFetchOptions()
  return <SessionsListCached {...opts} />
}

async function SessionsListCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: sessions} = await sanityFetch({query: SESSIONS_LISTING_QUERY, perspective, stega})

  if (!sessions || sessions.length === 0) {
    return <p className="mt-8 text-text-muted">No sessions announced yet.</p>
  }

  // Extract unique filter options from the data
  const tracks = extractTracks(sessions)
  const sessionTypes = extractSessionTypes(sessions)
  const levels = extractLevels(sessions)

  return (
    <SessionFilters
      sessions={sessions}
      tracks={tracks}
      sessionTypes={sessionTypes}
      levels={levels}
    />
  )
}

function extractTracks(sessions: SESSIONS_LISTING_QUERY_RESULT) {
  const map = new Map<string, {slug: string; name: string}>()
  for (const s of sessions) {
    if (s.track?.slug && s.track.name) {
      map.set(s.track.slug, {slug: s.track.slug, name: s.track.name})
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function extractSessionTypes(sessions: SESSIONS_LISTING_QUERY_RESULT) {
  const types = new Set<string>()
  for (const s of sessions) {
    if (s.sessionType) types.add(s.sessionType)
  }
  return Array.from(types).sort()
}

function extractLevels(sessions: SESSIONS_LISTING_QUERY_RESULT) {
  const levels = new Set<string>()
  for (const s of sessions) {
    if (s.level) levels.add(s.level)
  }
  return Array.from(levels).sort()
}
