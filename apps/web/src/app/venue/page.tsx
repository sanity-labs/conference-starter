import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {VENUE_QUERY} from '@repo/sanity-queries'
import type {VENUE_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'
import {createMetadata} from '@/lib/metadata'

async function fetchVenueForMetadata() {
  'use cache'
  const {data} = await sanityFetch({
    query: VENUE_QUERY,
    perspective: 'published',
    stega: false,
  })
  return data
}

export async function generateMetadata(): Promise<Metadata> {
  const venue = await fetchVenueForMetadata()
  if (!venue) return {title: 'Venue'}
  return createMetadata({
    title: venue.name ?? 'Venue',
    description: venue.address
      ? `Join us at ${venue.name}, ${venue.address}`
      : 'Venue for Everything NYC 2026',
    path: '/venue',
  })
}

export default function VenuePage() {
  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 sm:py-24">
      <Suspense>
        <VenueDynamic />
      </Suspense>
    </main>
  )
}

async function VenueDynamic() {
  const opts = await getDynamicFetchOptions()
  return <VenueCached {...opts} />
}

async function VenueCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: venue} = await sanityFetch({query: VENUE_QUERY, perspective, stega})

  if (!venue) {
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Venue</h1>
        <p className="mt-4 text-text-muted">Venue details coming soon.</p>
      </>
    )
  }

  return (
    <article>
      <VenueHeader venue={venue} />
      {venue.image && (
        <SanityImage
          value={venue.image}
          className="mt-8 w-full rounded-lg object-cover"
          width={800}
          height={400}
          sizes="(min-width: 768px) 48rem, 100vw"
        />
      )}
      {venue.description && (
        <section className="prose mt-8 max-w-none">
          <PortableText value={venue.description} />
        </section>
      )}
      <RoomsList rooms={venue.rooms} />
      {venue.transitInfo && <TransitSection transitInfo={venue.transitInfo} />}
      {venue.wifiInfo && (venue.wifiInfo.network || venue.wifiInfo.password) && (
        <WifiSection wifiInfo={venue.wifiInfo} />
      )}
    </article>
  )
}

function VenueHeader({venue}: {venue: NonNullable<VENUE_QUERY_RESULT>}) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{venue.name}</h1>
      {venue.address && (
        <address className="mt-2 text-lg text-text-muted not-italic">{venue.address}</address>
      )}
      {venue.mapUrl && (
        <p className="mt-2">
          <a
            href={venue.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Get Directions &rarr;
          </a>
        </p>
      )}
    </header>
  )
}

function RoomsList({rooms}: {rooms: NonNullable<VENUE_QUERY_RESULT>['rooms']}) {
  if (!rooms || rooms.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Rooms</h2>
      <ul className="mt-4 space-y-4">
        {rooms.map((room) => (
          <li key={room._id} id={`room-${room.slug}`} className="rounded-md border-l-4 border-border-strong pl-4 py-3">
            <p className="font-medium">{room.name}</p>
            <p className="text-sm text-text-muted">
              {[
                room.floor,
                room.capacity ? `${room.capacity} seats` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {room.amenities && room.amenities.length > 0 && (
              <ul className="mt-1 flex flex-wrap gap-2">
                {room.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-text-muted"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            )}
            {room.schedule && room.schedule.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {room.schedule.map((slot) => {
                  if (!slot.session) return null
                  const time = slot.startTime
                    ? new Date(slot.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'America/New_York',
                      })
                    : null
                  return (
                    <li key={slot._id} className="text-sm">
                      {time && (
                        <time dateTime={slot.startTime!} className="text-text-muted">
                          {time}
                        </time>
                      )}
                      {time && ' — '}
                      <Link
                        href={`/sessions/${slot.session.slug}`}
                        className="text-text-secondary hover:text-text-primary hover:underline"
                      >
                        {slot.session.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function TransitSection({
  transitInfo,
}: {
  transitInfo: NonNullable<NonNullable<VENUE_QUERY_RESULT>['transitInfo']>
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Getting Here</h2>
      <div className="prose mt-4 max-w-none">
        <PortableText value={transitInfo} />
      </div>
    </section>
  )
}

function WifiSection({
  wifiInfo,
}: {
  wifiInfo: NonNullable<NonNullable<VENUE_QUERY_RESULT>['wifiInfo']>
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">WiFi</h2>
      <dl className="mt-4 rounded-md border border-border p-4">
        {wifiInfo.network && (
          <>
            <dt className="text-sm font-medium text-text-muted">Network</dt>
            <dd className="mt-1">{wifiInfo.network}</dd>
          </>
        )}
        {wifiInfo.password && (
          <>
            <dt className="mt-3 text-sm font-medium text-text-muted">Password</dt>
            <dd className="mt-1 font-mono">{wifiInfo.password}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
