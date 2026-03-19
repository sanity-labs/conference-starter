import {Suspense} from 'react'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {VENUE_QUERY} from '@repo/sanity-queries'
import type {VENUE_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'

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
  return {
    title: venue.name,
    description: venue.address ? `Join us at ${venue.name}, ${venue.address}` : `Venue for Everything NYC 2026`,
  }
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
        <h1 className="text-4xl font-bold tracking-tight">Venue</h1>
        <p className="mt-4 text-gray-500">Venue details coming soon.</p>
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
        />
      )}
      {venue.description && (
        <section className="prose mt-8">
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
      <h1 className="text-4xl font-bold tracking-tight">{venue.name}</h1>
      {venue.address && (
        <address className="mt-2 text-lg text-gray-600 not-italic">{venue.address}</address>
      )}
      {venue.mapUrl && (
        <p className="mt-2">
          <a
            href={venue.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline"
          >
            Get Directions
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
      <h2 className="text-2xl font-bold">Rooms</h2>
      <ul className="mt-4 space-y-4">
        {rooms.map((room) => (
          <li key={room._id} className="border-l-2 pl-4">
            <p className="font-medium">{room.name}</p>
            <p className="text-sm text-gray-600">
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
                    className="inline-block rounded-full border px-2 py-0.5 text-xs text-gray-600"
                  >
                    {amenity}
                  </li>
                ))}
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
      <h2 className="text-2xl font-bold">Getting Here</h2>
      <div className="prose mt-4">
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
      <h2 className="text-2xl font-bold">WiFi</h2>
      <dl className="mt-4">
        {wifiInfo.network && (
          <>
            <dt className="text-sm font-medium text-gray-500">Network</dt>
            <dd className="mt-1">{wifiInfo.network}</dd>
          </>
        )}
        {wifiInfo.password && (
          <>
            <dt className="mt-3 text-sm font-medium text-gray-500">Password</dt>
            <dd className="mt-1 font-mono">{wifiInfo.password}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
