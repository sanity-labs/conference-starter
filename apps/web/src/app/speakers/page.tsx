import {Suspense} from 'react'
import Link from 'next/link'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {SPEAKERS_QUERY} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {createMetadata} from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Speakers',
  description:
    'Meet the speakers at Everything NYC 2026 — developers, designers, and creative thinkers shaping digital experiences.',
  path: '/speakers',
})

export default function SpeakersPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-wide px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Speakers</h1>
      <Suspense>
        <SpeakersListDynamic />
      </Suspense>
    </main>
  )
}

async function SpeakersListDynamic() {
  const opts = await getDynamicFetchOptions()
  return <SpeakersListCached {...opts} />
}

async function SpeakersListCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: speakers} = await sanityFetch({query: SPEAKERS_QUERY, perspective, stega})

  if (!speakers || speakers.length === 0) {
    return <p className="mt-8 text-text-muted">No speakers announced yet.</p>
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
      {speakers.map((speaker) => (
        <li key={speaker._id} className="group">
          <Link href={`/speakers/${speaker.slug}`}>
            {speaker.photo && (
              <SanityImage
                value={speaker.photo}
                className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
                width={300}
                height={300}
                sizes="(min-width: 640px) 33vw, 50vw"
              />
            )}
            <p className="mt-2 font-medium">{speaker.name}</p>
            {speaker.role && (
              <p className="text-sm text-text-muted">{speaker.role}</p>
            )}
            {speaker.company && (
              <p className="text-sm text-text-muted">{speaker.company}</p>
            )}
            {speaker.sessionCount > 0 && (
              <p className="mt-1 text-xs text-text-muted">
                {speaker.sessionCount} session{speaker.sessionCount !== 1 ? 's' : ''}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
