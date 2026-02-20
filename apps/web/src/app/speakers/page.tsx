import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {SPEAKERS_QUERY} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'

export const metadata: Metadata = {
  title: 'Speakers — Everything NYC 2026',
  description: 'Meet the speakers at Everything NYC 2026.',
}

export default function SpeakersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Speakers</h1>
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
    return <p className="mt-8 text-gray-500">No speakers announced yet.</p>
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3">
      {speakers.map((speaker) => (
        <li key={speaker._id}>
          <Link href={`/speakers/${speaker.slug}`}>
            {speaker.photo && (
              <SanityImage
                value={speaker.photo}
                className="aspect-square w-full rounded-lg object-cover"
                width={300}
                height={300}
              />
            )}
            <p className="mt-2 font-medium">{speaker.name}</p>
            {speaker.role && (
              <p className="text-sm text-gray-600">{speaker.role}</p>
            )}
            {speaker.company && (
              <p className="text-sm text-gray-500">{speaker.company}</p>
            )}
            {speaker.sessionCount > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {speaker.sessionCount} session{speaker.sessionCount !== 1 ? 's' : ''}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
