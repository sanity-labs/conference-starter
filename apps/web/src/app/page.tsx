import {Suspense} from 'react'
import Link from 'next/link'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CONFERENCE_QUERY, SPEAKERS_QUERY} from '@repo/sanity-queries'
import type {
  CONFERENCE_QUERY_RESULT,
  SPEAKERS_QUERY_RESULT,
} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'

// Layer 1: Sync page with Suspense
export default function HomePage() {
  return (
    <main>
      <Suspense>
        <HomePageDynamic />
      </Suspense>
    </main>
  )
}

// Layer 2: Dynamic — reads cookies/draft mode outside cache boundary
async function HomePageDynamic() {
  const opts = await getDynamicFetchOptions()
  return <HomePageCached {...opts} />
}

// Layer 3: Cached — receives perspective/stega as cache keys
async function HomePageCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const [{data: conference}, {data: speakers}] = await Promise.all([
    sanityFetch({query: CONFERENCE_QUERY, perspective, stega}),
    sanityFetch({query: SPEAKERS_QUERY, perspective, stega}),
  ])

  if (!conference) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight">Everything NYC 2026</h1>
        <p className="mt-4 text-gray-500">No conference data found.</p>
      </section>
    )
  }

  return (
    <>
      <HeroSection conference={conference} />
      <SpeakersPreview speakers={speakers} />
      <VenueSection conference={conference} />
    </>
  )
}

function HeroSection({conference}: {conference: NonNullable<CONFERENCE_QUERY_RESULT>}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">{conference.name}</h1>
      {conference.tagline && (
        <p className="mt-4 text-xl text-gray-600">{conference.tagline}</p>
      )}
      {conference.description && (
        <p className="mt-6 text-gray-700">{conference.description}</p>
      )}
      {conference.startDate && (
        <p className="mt-4 text-sm text-gray-500">
          <time dateTime={conference.startDate}>
            {new Date(conference.startDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
          {conference.endDate && (
            <>
              {' — '}
              <time dateTime={conference.endDate}>
                {new Date(conference.endDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </>
          )}
        </p>
      )}
      {conference.tracks && conference.tracks.length > 0 && (
        <nav className="mt-6">
          <h2 className="sr-only">Tracks</h2>
          <ul className="flex flex-wrap gap-2">
            {conference.tracks.map((track) => (
              <li key={track._id}>
                <Link
                  href={`/schedule?track=${track.slug}`}
                  className="inline-block rounded-full border px-3 py-1 text-sm"
                >
                  {track.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <nav className="mt-8 flex gap-4">
        <Link href="/schedule" className="font-medium underline">
          View Schedule
        </Link>
        <Link href="/speakers" className="font-medium underline">
          Speakers
        </Link>
      </nav>
    </section>
  )
}

function SpeakersPreview({speakers}: {speakers: SPEAKERS_QUERY_RESULT}) {
  if (!speakers || speakers.length === 0) return null

  const featured = speakers.slice(0, 8)

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h2 className="text-2xl font-bold">Speakers</h2>
      <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {featured.map((speaker) => (
          <li key={speaker._id}>
            <Link href={`/speakers/${speaker.slug}`}>
              {speaker.photo && (
                <SanityImage
                  value={speaker.photo}
                  className="aspect-square w-full rounded-lg object-cover"
                  width={200}
                  height={200}
                />
              )}
              <p className="mt-2 font-medium">{speaker.name}</p>
              {speaker.role && (
                <p className="text-sm text-gray-600">{speaker.role}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {speakers.length > 8 && (
        <p className="mt-6">
          <Link href="/speakers" className="font-medium underline">
            View all {speakers.length} speakers
          </Link>
        </p>
      )}
    </section>
  )
}

function VenueSection({conference}: {conference: NonNullable<CONFERENCE_QUERY_RESULT>}) {
  if (!conference.venue) return null

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h2 className="text-2xl font-bold">Venue</h2>
      <p className="mt-2 text-lg">{conference.venue.name}</p>
      <address className="mt-1 text-gray-600 not-italic">{conference.venue.address}</address>
    </section>
  )
}
