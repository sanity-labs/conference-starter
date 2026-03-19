import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CONFERENCE_QUERY, SPEAKERS_QUERY, SESSIONS_SUMMARY_QUERY} from '@repo/sanity-queries'
import type {
  CONFERENCE_QUERY_RESULT,
  SPEAKERS_QUERY_RESULT,
  SESSIONS_SUMMARY_QUERY_RESULT,
} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {JsonLd} from '@/components/json-ld'
import type {Event} from 'schema-dts'
import {SITE_URL, ogImageUrl} from '@/lib/metadata'

async function fetchConferenceForMetadata() {
  'use cache'
  const {data} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective: 'published',
    stega: false,
  })
  return data
}

export async function generateMetadata(): Promise<Metadata> {
  const conference = await fetchConferenceForMetadata()
  if (!conference) return {}
  const image = ogImageUrl(conference.socialCard)
  return {
    title: conference.name ?? undefined,
    description: conference.description ?? undefined,
    openGraph: {
      type: 'website',
      ...(image && {images: [{url: image, width: 1200, height: 630}]}),
    },
  }
}

// Layer 1: Sync page with Suspense
export default function HomePage() {
  return (
    <main id="main-content">
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

  const [{data: conference}, {data: speakers}, {data: sessions}] = await Promise.all([
    sanityFetch({query: CONFERENCE_QUERY, perspective, stega}),
    sanityFetch({query: SPEAKERS_QUERY, perspective, stega}),
    sanityFetch({query: SESSIONS_SUMMARY_QUERY, perspective, stega}),
  ])

  if (!conference) {
    return (
      <section className="mx-auto max-w-content px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything NYC 2026</h1>
        <p className="mt-4 text-text-muted">No conference data found.</p>
      </section>
    )
  }

  return (
    <>
      <JsonLd<Event>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: conference.name ?? 'Everything NYC 2026',
          ...(conference.description && {description: conference.description}),
          ...(conference.startDate && {startDate: conference.startDate}),
          ...(conference.endDate && {endDate: conference.endDate}),
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          eventStatus: 'https://schema.org/EventScheduled',
          ...(conference.venue && {
            location: {
              '@type': 'Place',
              name: conference.venue.name ?? undefined,
              ...(conference.venue.address && {
                address: conference.venue.address,
              }),
            },
          }),
          organizer: {
            '@type': 'Organization',
            name: 'Sanity',
            url: 'https://www.sanity.io',
          },
          ...(sessions &&
            sessions.length > 0 && {
              subEvent: sessions.map((s) => ({
                '@type': 'Event' as const,
                name: s.title ?? undefined,
                url: `${SITE_URL}/sessions/${s.slug}`,
              })),
            }),
        }}
      />
      <HeroSection conference={conference} />
      <SpeakersPreview speakers={speakers} />
      <VenueSection conference={conference} />
    </>
  )
}

function HeroSection({conference}: {conference: NonNullable<CONFERENCE_QUERY_RESULT>}) {
  return (
    <section className="mx-auto max-w-content px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{conference.name}</h1>
      {conference.tagline && (
        <p className="mt-4 text-xl text-text-secondary">{conference.tagline}</p>
      )}
      {conference.description && (
        <p className="mt-6 text-text-secondary">{conference.description}</p>
      )}
      {conference.startDate && (
        <p className="mt-4 text-sm text-text-muted">
          <time dateTime={conference.startDate}>
            {new Date(conference.startDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'America/New_York',
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
                  timeZone: 'America/New_York',
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
                  href={`/sessions?track=${track.slug}`}
                  className="inline-block rounded-full border border-border px-3 py-1 text-sm text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                >
                  {track.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <nav className="mt-8 flex flex-wrap gap-3">
        <Link href="/schedule" className="btn btn-secondary">
          Schedule
        </Link>
        <Link href="/sessions" className="btn btn-secondary">
          Sessions
        </Link>
        <Link href="/speakers" className="btn btn-secondary">
          Speakers
        </Link>
        <Link href="/sponsors" className="btn btn-secondary">
          Sponsors
        </Link>
        <Link href="/venue" className="btn btn-secondary">
          Venue
        </Link>
      </nav>
    </section>
  )
}

function SpeakersPreview({speakers}: {speakers: SPEAKERS_QUERY_RESULT}) {
  if (!speakers || speakers.length === 0) return null

  const featured = speakers.slice(0, 8)

  return (
    <section className="mx-auto max-w-content px-6 py-12">
      <h2 className="text-2xl font-semibold tracking-tight">Speakers</h2>
      <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {featured.map((speaker) => (
          <li key={speaker._id} className="group">
            <Link href={`/speakers/${speaker.slug}`}>
              {speaker.photo && (
                <SanityImage
                  value={speaker.photo}
                  className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
                  width={200}
                  height={200}
                  sizes="(min-width: 640px) 25vw, 50vw"
                />
              )}
              <p className="mt-2 font-medium">{speaker.name}</p>
              {speaker.role && (
                <p className="text-sm text-text-muted">{speaker.role}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {speakers.length > 8 && (
        <p className="mt-6">
          <Link href="/speakers" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
            View all {speakers.length} speakers &rarr;
          </Link>
        </p>
      )}
    </section>
  )
}

function VenueSection({conference}: {conference: NonNullable<CONFERENCE_QUERY_RESULT>}) {
  if (!conference.venue) return null

  return (
    <section className="mx-auto max-w-content px-6 py-12">
      <h2 className="text-2xl font-semibold tracking-tight">Venue</h2>
      <div className="mt-4 rounded-lg border border-border p-6">
        <p className="text-lg font-medium">{conference.venue.name}</p>
        <address className="mt-1 text-text-muted not-italic">{conference.venue.address}</address>
        <p className="mt-4">
          <Link href="/venue" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
            Venue details &rarr;
          </Link>
        </p>
      </div>
    </section>
  )
}
