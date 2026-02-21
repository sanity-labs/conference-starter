import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {client} from '@/sanity/client'
import {SESSION_DETAIL_QUERY, SESSION_SLUGS_QUERY} from '@repo/sanity-queries'
import type {SESSION_DETAIL_QUERY_RESULT} from '@repo/sanity-queries'
import {stegaClean} from '@sanity/client/stega'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'
import {ogImageUrl} from '@/lib/metadata'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const sessions = await client.fetch(SESSION_SLUGS_QUERY)
  return sessions.map((s) => ({slug: s.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const session = await fetchSessionForMetadata(slug)
  if (!session) return {}
  const image = ogImageUrl(session.ogImage)
  return {
    title: session.seoTitle || session.title,
    description: session.seoDescription || undefined,
    openGraph: {
      type: 'article',
      ...(image && {images: [{url: image, width: 1200, height: 630}]}),
    },
  }
}

async function fetchSessionForMetadata(slug: string) {
  'use cache'
  const {data} = await sanityFetch({
    query: SESSION_DETAIL_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })
  return data
}

export default async function SessionPage({params}: Props) {
  const {slug} = await params
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <Suspense>
        <SessionDetailDynamic slug={slug} />
      </Suspense>
    </main>
  )
}

async function SessionDetailDynamic({slug}: {slug: string}) {
  const opts = await getDynamicFetchOptions()
  return <SessionDetailCached slug={slug} {...opts} />
}

async function SessionDetailCached({
  slug,
  perspective,
  stega,
}: {slug: string} & DynamicFetchOptions) {
  'use cache'

  const {data: session} = await sanityFetch({
    query: SESSION_DETAIL_QUERY,
    params: {slug},
    perspective,
    stega,
  })

  if (!session) notFound()

  return (
    <article>
      <header>
        <p className="text-sm text-gray-500">
          {[
            session.sessionType &&
              session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1),
            session.level,
            session.duration && `${session.duration} min`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{session.title}</h1>

        {session.track && (
          <p className="mt-2 text-sm">
            Track: <strong>{session.track.name}</strong>
          </p>
        )}

        {session.slot && session.slot.startTime && (
          <p className="mt-2 text-sm text-gray-600">
            <time dateTime={session.slot.startTime}>
              {new Date(session.slot.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                timeZone: 'America/New_York',
              })}
              {' at '}
              {new Date(session.slot.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'America/New_York',
              })}
            </time>
            {session.slot.endTime && (
              <>
                {' — '}
                <time dateTime={session.slot.endTime}>
                  {new Date(session.slot.endTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/New_York',
                  })}
                </time>
              </>
            )}
            {session.slot.room && ` · ${session.slot.room.name}`}
            {session.slot.room?.floor && ` (${session.slot.room.floor})`}
          </p>
        )}
      </header>

      <SpeakersList speakers={session.speakers} moderator={session.moderator} />

      {session.abstract && (
        <section className="prose mt-8">
          <h2>About this session</h2>
          <PortableText value={session.abstract} />
        </section>
      )}

      <WorkshopDetails session={session} />
      <MediaLinks session={session} />

      <p className="mt-12">
        <Link href="/schedule" className="text-sm underline">
          &larr; Back to schedule
        </Link>
      </p>
    </article>
  )
}

function SpeakersList({
  speakers,
  moderator,
}: {
  speakers: NonNullable<SESSION_DETAIL_QUERY_RESULT>['speakers']
  moderator: NonNullable<SESSION_DETAIL_QUERY_RESULT>['moderator']
}) {
  if (!speakers || speakers.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">
        {speakers.length === 1 ? 'Speaker' : 'Speakers'}
      </h2>
      <ul className="mt-3 space-y-3">
        {speakers.map((speaker) => (
          <li key={speaker._id} className="flex items-center gap-3">
            {speaker.photo && (
              <SanityImage
                value={speaker.photo}
                className="h-10 w-10 rounded-full object-cover"
                width={80}
                height={80}
              />
            )}
            <div>
              <Link href={`/speakers/${speaker.slug}`} className="font-medium underline">
                {speaker.name}
              </Link>
              {speaker.role && (
                <p className="text-sm text-gray-600">
                  {speaker.role}
                  {speaker.company && `, ${speaker.company}`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {moderator && (
        <p className="mt-3 text-sm text-gray-600">
          Moderated by{' '}
          <Link href={`/speakers/${moderator.slug}`} className="underline">
            {moderator.name}
          </Link>
        </p>
      )}
    </section>
  )
}

function WorkshopDetails({
  session,
}: {
  session: NonNullable<SESSION_DETAIL_QUERY_RESULT>
}) {
  if (stegaClean(session.sessionType) !== 'workshop') return null

  return (
    <section className="mt-8 space-y-4">
      {session.capacity && (
        <p className="text-sm">
          <strong>Capacity:</strong> {session.capacity} participants
        </p>
      )}
      {session.prerequisites && (
        <div>
          <h3 className="font-semibold">Prerequisites</h3>
          <p className="mt-1 text-gray-700">{session.prerequisites}</p>
        </div>
      )}
      {session.materials && session.materials.length > 0 && (
        <div>
          <h3 className="font-semibold">Materials</h3>
          <ul className="mt-1 space-y-1">
            {session.materials.map((m) => (
              <li key={m.url}>
                <a href={m.url!} target="_blank" rel="noopener noreferrer" className="underline">
                  {m.title}
                </a>
                {m.type && <span className="ml-1 text-xs text-gray-500">({m.type})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function MediaLinks({session}: {session: NonNullable<SESSION_DETAIL_QUERY_RESULT>}) {
  if (!session.slidesUrl && !session.recordingUrl) return null

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Resources</h2>
      <ul className="mt-2 space-y-1">
        {session.slidesUrl && (
          <li>
            <a href={session.slidesUrl} target="_blank" rel="noopener noreferrer" className="underline">
              View slides
            </a>
          </li>
        )}
        {session.recordingUrl && (
          <li>
            <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Watch recording
            </a>
          </li>
        )}
      </ul>
    </section>
  )
}
