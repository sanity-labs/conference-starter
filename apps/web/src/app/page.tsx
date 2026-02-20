import {Suspense} from 'react'
import {sanityFetch, getDynamicFetchOptions} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {defineQuery} from 'next-sanity'

const CONFERENCE_QUERY = defineQuery(
  `*[_type == "conference"][0]{ name, tagline, description }`,
)

// Layer 1: Sync page with Suspense
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-gray-500">Loading...</p>
        </main>
      }
    >
      <DynamicHome />
    </Suspense>
  )
}

// Layer 2: Dynamic — resolves perspective outside cache boundary
async function DynamicHome() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedHome perspective={perspective} stega={stega} />
}

// Layer 3: Cached — perspective + stega are cache keys
async function CachedHome({perspective, stega}: DynamicFetchOptions) {
  'use cache'
  // TODO: TypeGen will generate proper types in Stage 4
  const {data} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective,
    stega,
  })
  const conference = data as {
    name: string | null
    tagline: string | null
    description: string | null
  } | null

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">
        {conference?.name ?? 'Everything NYC 2026'}
      </h1>
      {conference?.tagline && (
        <p className="mt-4 text-xl text-gray-600">{conference.tagline}</p>
      )}
      {conference?.description && (
        <p className="mt-6 text-gray-700 leading-relaxed">
          {conference.description}
        </p>
      )}
      {!conference && (
        <p className="mt-8 text-gray-500">
          No conference data yet — create a conference document in the Studio.
        </p>
      )}
    </main>
  )
}
