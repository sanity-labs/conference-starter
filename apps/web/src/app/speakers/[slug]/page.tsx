import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {client} from '@/sanity/client'
import {SPEAKER_DETAIL_QUERY, SPEAKER_SLUGS_QUERY} from '@repo/sanity-queries'
import type {SPEAKER_DETAIL_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'
import {JsonLd} from '@/components/json-ld'
import type {Person} from 'schema-dts'
import {SITE_URL, ogImageUrl, createMetadata} from '@/lib/metadata'
import {BreadcrumbJsonLd} from '@/components/breadcrumb-json-ld'
import {Breadcrumbs} from '@/components/breadcrumbs'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const speakers = await client.fetch(SPEAKER_SLUGS_QUERY)
  return speakers.map((s) => ({slug: s.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const speaker = await fetchSpeakerForMetadata(slug)
  if (!speaker) return {}

  // Use custom ogImage if set, fallback to dynamic OG
  const image =
    ogImageUrl(speaker.ogImage) ?? `${SITE_URL}/api/og?type=speaker&slug=${slug}`

  // Auto-generate description from structured data
  const sessionTitles = speaker.sessions?.map((s) => s.title).filter(Boolean) ?? []
  const autoDescription = sessionTitles.length > 0
    ? `${speaker.name} is speaking about ${sessionTitles.join(', ')}`
    : [speaker.role, speaker.company].filter(Boolean).join(' at ')

  return createMetadata({
    title: speaker.seoTitle || speaker.name || 'Speaker',
    description: speaker.seoDescription || autoDescription,
    ogImage: image,
    path: `/speakers/${slug}`,
    type: 'profile',
  })
}

async function fetchSpeakerForMetadata(slug: string) {
  'use cache'
  const {data} = await sanityFetch({
    query: SPEAKER_DETAIL_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })
  return data
}

export default async function SpeakerPage({params}: Props) {
  const {slug} = await params
  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 lg:px-8 sm:py-24">
      <Suspense>
        <SpeakerDetailDynamic slug={slug} />
      </Suspense>
    </main>
  )
}

async function SpeakerDetailDynamic({slug}: {slug: string}) {
  const opts = await getDynamicFetchOptions()
  return <SpeakerDetailCached slug={slug} {...opts} />
}

async function SpeakerDetailCached({
  slug,
  perspective,
  stega,
}: {slug: string} & DynamicFetchOptions) {
  'use cache'

  const {data: speaker} = await sanityFetch({
    query: SPEAKER_DETAIL_QUERY,
    params: {slug},
    perspective,
    stega,
  })

  if (!speaker) notFound()

  const sameAs = [
    speaker.twitter && `https://x.com/${speaker.twitter}`,
    speaker.github && `https://github.com/${speaker.github}`,
    speaker.linkedin,
    speaker.website,
  ].filter(Boolean) as string[]

  return (
    <article>
      <BreadcrumbJsonLd
        items={[
          {name: 'Speakers', path: '/speakers'},
          {name: speaker.name ?? 'Speaker', path: `/speakers/${slug}`},
        ]}
      />
      <Breadcrumbs
        items={[
          {name: 'Speakers', path: '/speakers'},
          {name: speaker.name ?? 'Speaker', path: `/speakers/${slug}`},
        ]}
      />
      <JsonLd<Person>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: speaker.name ?? undefined,
          ...(speaker.role && {jobTitle: speaker.role}),
          ...(speaker.company && {worksFor: {'@type': 'Organization', name: speaker.company}}),
          url: `${SITE_URL}/speakers/${slug}`,
          ...(speaker.photo && {image: ogImageUrl(speaker.photo) ?? undefined}),
          ...(sameAs.length > 0 && {sameAs}),
        }}
      />
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {speaker.photo && (
          <SanityImage
            value={{...speaker.photo, alt: speaker.photo.alt || speaker.name}}
            className="h-32 w-32 rounded-lg object-cover"
            width={384}
            height={384}
            sizes="128px"
          />
        )}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{speaker.name}</h1>
          {speaker.role && <p className="mt-1 text-lg text-text-secondary">{speaker.role}</p>}
          {speaker.company && <p className="text-text-muted">{speaker.company}</p>}
          <SocialLinks speaker={speaker} />
        </div>
      </header>

      {speaker.bio && (
        <section className="prose mt-8 max-w-prose">
          <PortableText value={speaker.bio} />
        </section>
      )}

      <SpeakerSessions sessions={speaker.sessions} />
    </article>
  )
}

function SocialLinks({speaker}: {speaker: NonNullable<SPEAKER_DETAIL_QUERY_RESULT>}) {
  const links = [
    speaker.twitter && {label: `@${speaker.twitter}`, href: `https://x.com/${speaker.twitter}`},
    speaker.github && {label: 'GitHub', href: `https://github.com/${speaker.github}`},
    speaker.linkedin && {label: 'LinkedIn', href: speaker.linkedin},
    speaker.website && {label: 'Website', href: speaker.website},
  ].filter(Boolean) as Array<{label: string; href: string}>

  if (links.length === 0) return null

  return (
    <ul className="mt-2 flex gap-3 text-sm">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

function SpeakerSessions({
  sessions,
}: {
  sessions: NonNullable<SPEAKER_DETAIL_QUERY_RESULT>['sessions']
}) {
  if (!sessions || sessions.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sessions</h2>
      <ul role="list" className="mt-4 space-y-4">
        {sessions.map((session) => (
          <li key={session._id} className="card">
            <Link href={`/sessions/${session.slug}`} className="font-medium hover:underline">
              {session.title}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
              {session.sessionType && (
                <span>
                  {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
                </span>
              )}
              {session.level && (
                <>
                  {session.sessionType && ' · '}
                  <span>{session.level}</span>
                </>
              )}
              {session.track?.name && (
                <>
                  {(session.sessionType || session.level) && ' · '}
                  <Link
                    href={`/sessions?track=${session.track.slug}`}
                    className="hover:text-text-primary hover:underline"
                  >
                    {session.track.name}
                  </Link>
                </>
              )}
            </p>
            {session.slot && session.slot.startTime && (
              <p className="mt-1 text-sm text-text-muted">
                <time dateTime={session.slot.startTime}>
                  {new Date(session.slot.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/New_York',
                  })}
                </time>
                {session.slot.room?.name && (
                  <>
                    {' — '}
                    <Link
                      href={`/venue#room-${session.slot.room.slug}`}
                      className="hover:underline"
                    >
                      {session.slot.room.name}
                    </Link>
                  </>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
