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
    'Meet the speakers — practitioners and thinkers shaping the future of structured content.',
  path: '/speakers',
})

export default function SpeakersPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Speakers</h1>
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
    <ul role="list" className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
      {speakers.map((speaker) => (
        <li key={speaker._id} className="group">
          <Link href={`/speakers/${speaker.slug}`}>
            {speaker.photo && (
              <SanityImage
                value={speaker.photo}
                className="aspect-square w-full rounded-lg object-cover outline-1 -outline-offset-1 outline-black/5 group-hover:opacity-90"
                width={400}
                height={400}
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              />
            )}
            <p className="mt-2 font-medium">{speaker.name}</p>
            {speaker.role && (
              <p className="text-base text-text-muted sm:text-sm">{speaker.role}</p>
            )}
            {speaker.company && (
              <p className="text-base text-text-muted sm:text-sm">{speaker.company}</p>
            )}
            {speaker.sessionCount > 0 && (
              <p className="mt-1 text-sm text-text-muted sm:text-xs">
                {speaker.sessionCount} session{speaker.sessionCount !== 1 ? 's' : ''}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
