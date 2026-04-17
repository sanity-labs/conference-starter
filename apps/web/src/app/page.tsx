import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {
  CONFERENCE_QUERY,
  SPEAKERS_QUERY,
  SESSIONS_SUMMARY_QUERY,
  FEATURED_SESSIONS_QUERY,
  SPONSORS_QUERY,
} from '@repo/sanity-queries'
import type {
  CONFERENCE_QUERY_RESULT,
  SPEAKERS_QUERY_RESULT,
  SESSIONS_SUMMARY_QUERY_RESULT,
  FEATURED_SESSIONS_QUERY_RESULT,
  SPONSORS_QUERY_RESULT,
} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {TrackBadge} from '@/components/track-badge'
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

  const [
    {data: conference},
    {data: speakers},
    {data: sessions},
    {data: featuredSessions},
    {data: sponsors},
  ] = await Promise.all([
    sanityFetch({query: CONFERENCE_QUERY, perspective, stega}),
    sanityFetch({query: SPEAKERS_QUERY, perspective, stega}),
    sanityFetch({query: SESSIONS_SUMMARY_QUERY, perspective, stega}),
    sanityFetch({query: FEATURED_SESSIONS_QUERY, perspective, stega}),
    sanityFetch({query: SPONSORS_QUERY, perspective, stega}),
  ])

  if (!conference) {
    return (
      <section className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-24">
        <h1 className="max-w-[30ch] text-3xl font-semibold tracking-tight sm:text-5xl">ContentOps Conf</h1>
        <p className="mt-4 text-pretty text-text-muted">No conference data found.</p>
      </section>
    )
  }

  return (
    <>
      <JsonLd<Event>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: conference.name ?? 'ContentOps Conf',
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
      <SessionsPreview sessions={featuredSessions} />
      <SponsorsBar sponsors={sponsors} />
      <VenueSection conference={conference} />
    </>
  )
}

function HeroSection({conference}: {conference: NonNullable<CONFERENCE_QUERY_RESULT>}) {
  const dateLabel = conference.startDate
    ? formatDateRange(conference.startDate, conference.endDate)
    : null
  const venueLabel = conference.venue?.name

  return (
    <section className="border-b border-border bg-surface-alt">
      <div className="mx-auto max-w-content-max px-6 py-20 lg:px-8 sm:py-32">
        {/* Date & location badge */}
        {(dateLabel || venueLabel) && (
          <p className="text-sm font-medium tabular-nums text-text-muted">
            {dateLabel}
            {dateLabel && venueLabel && ' · '}
            {venueLabel && (
              <Link href="/venue" className="hover:text-text-primary hover:underline">
                {venueLabel}
              </Link>
            )}
          </p>
        )}

        <h1 className="mt-4 max-w-[24ch] text-4xl font-semibold tracking-tight sm:text-6xl">
          {conference.name}
        </h1>

        {conference.tagline && (
          <p className="mt-6 max-w-[48ch] text-lg text-pretty text-text-secondary sm:text-xl">
            {conference.tagline}
          </p>
        )}

        {conference.tracks && conference.tracks.length > 0 && (
          <nav className="mt-8">
            <h2 className="sr-only">Tracks</h2>
            <ul className="flex flex-wrap gap-2">
              {conference.tracks.map((track) => (
                <li key={track._id}>
                  <TrackBadge name={track.name} slug={track.slug} color={track.color} />
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav className="mt-8 flex flex-wrap gap-3">
          <Link href="/schedule" className="btn btn-primary">
            View Schedule
          </Link>
          <Link href="/sessions" className="btn btn-secondary">
            Browse Sessions
          </Link>
          <Link href="/speakers" className="btn btn-secondary">
            Meet Speakers
          </Link>
        </nav>
      </div>
    </section>
  )
}

function formatDateRange(start: string, end: string | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }
  const startStr = new Date(start).toLocaleDateString('en-US', opts)
  if (!end) return startStr
  // Same month? Shorten to "October 15–16, 2026"
  const s = new Date(start)
  const e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', {month: 'long', timeZone: 'America/New_York'})} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }
  return `${startStr} — ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function SpeakersPreview({speakers}: {speakers: SPEAKERS_QUERY_RESULT}) {
  if (!speakers || speakers.length === 0) return null

  const featured = speakers.slice(0, 8)

  return (
    <section className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-20">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Speakers</h2>
      <ul role="list" className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {featured.map((speaker) => (
          <li key={speaker._id} className="group">
            <Link
              href={`/speakers/${speaker.slug}`}
              className="flex items-center gap-4 sm:block"
            >
              {speaker.photo && (
                <SanityImage
                  value={speaker.photo}
                  className="size-20 shrink-0 rounded-lg object-cover outline-1 -outline-offset-1 outline-[color-mix(in_oklab,var(--color-text-primary)_10%,transparent)] group-hover:opacity-90 sm:aspect-square sm:size-auto sm:w-full"
                  width={400}
                  height={400}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 80px"
                />
              )}
              <div className="min-w-0 sm:mt-3">
                <p className="font-medium">{speaker.name}</p>
                {(speaker.role || speaker.company) && (
                  <p className="text-base text-text-muted sm:text-sm">
                    {[speaker.role, speaker.company].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {speakers.length > 8 && (
        <p className="mt-6">
          <Link href="/speakers" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            View all {speakers.length} speakers &rarr;
          </Link>
        </p>
      )}
    </section>
  )
}

function SessionsPreview({sessions}: {sessions: FEATURED_SESSIONS_QUERY_RESULT}) {
  if (!sessions || sessions.length === 0) return null

  return (
    <section className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-20">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sessions</h2>
      <ul role="list" className="mt-6 space-y-4">
        {sessions.map((session) => (
          <li key={session._id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/sessions/${session.slug}`} className="font-medium hover:underline">
                {session.title}
              </Link>
              {session.sessionType && (
                <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-on-muted">
                  {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
                </span>
              )}
              {session.track && (
                <TrackBadge name={session.track.name} slug={session.track.slug} color={session.track.color} />
              )}
            </div>
            {session.speakers && session.speakers.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-3">
                {session.speakers.map((s) => (
                  <li key={s._id} className="flex items-center gap-2 text-sm">
                    {s.photo && (
                      <SanityImage
                        value={s.photo}
                        className="size-6 rounded-full object-cover"
                        width={48}
                        height={48}
                        sizes="24px"
                      />
                    )}
                    <Link href={`/speakers/${s.slug}`} className="text-text-muted hover:text-text-primary hover:underline">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/sessions" className="text-sm font-medium text-text-secondary hover:text-text-primary">
          View all sessions &rarr;
        </Link>
      </p>
    </section>
  )
}

function SponsorsBar({sponsors}: {sponsors: SPONSORS_QUERY_RESULT}) {
  if (!sponsors || sponsors.length === 0) return null

  // Show platinum and gold tier sponsors
  const topSponsors = sponsors.filter(
    (s) => s.tier === 'platinum' || s.tier === 'gold',
  )
  if (topSponsors.length === 0) return null

  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-content-max px-6 lg:px-8">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sponsors</h2>
      <ul role="list" className="mt-6 flex flex-wrap items-center gap-8">
        {topSponsors.map((sponsor) => (
          <li key={sponsor._id}>
            {sponsor.logo ? (
              <a
                href={sponsor.website ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80"
              >
                <SanityImage
                  value={sponsor.logo}
                  className={sponsor.tier === 'platinum' ? 'h-12' : 'h-10'}
                  width={sponsor.tier === 'platinum' ? 200 : 160}
                  height={sponsor.tier === 'platinum' ? 48 : 40}
                  sizes="200px"
                />
              </a>
            ) : (
              <a
                href={sponsor.website ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                {sponsor.name}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/sponsors" className="text-sm font-medium text-text-secondary hover:text-text-primary">
          View all sponsors &rarr;
        </Link>
      </p>
      </div>
    </section>
  )
}

function VenueSection({conference}: {conference: NonNullable<CONFERENCE_QUERY_RESULT>}) {
  if (!conference.venue) return null

  return (
    <section className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-20">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Venue</h2>
      <div className="card mt-4">
        <p className="text-lg font-medium">{conference.venue.name}</p>
        <address className="mt-1 text-text-muted not-italic">{conference.venue.address}</address>
        <p className="mt-4">
          <Link href="/venue" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Venue details &rarr;
          </Link>
        </p>
      </div>
    </section>
  )
}
