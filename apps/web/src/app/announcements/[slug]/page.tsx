import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {client} from '@/sanity/client'
import {ANNOUNCEMENT_DETAIL_QUERY, ANNOUNCEMENT_SLUGS_QUERY} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'
import {ogImageUrl} from '@/lib/metadata'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const announcements = await client.fetch(ANNOUNCEMENT_SLUGS_QUERY)
  return announcements.map((a) => ({slug: a.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const announcement = await fetchAnnouncementForMetadata(slug)
  if (!announcement) return {}
  const image = ogImageUrl(announcement.ogImage) ?? ogImageUrl(announcement.coverImage)
  return {
    title: announcement.seoTitle || announcement.title,
    description: announcement.seoDescription || announcement.excerpt || undefined,
    openGraph: {
      type: 'article',
      ...(announcement.publishedAt && {publishedTime: announcement.publishedAt}),
      ...(image && {images: [{url: image, width: 1200, height: 630}]}),
    },
  }
}

async function fetchAnnouncementForMetadata(slug: string) {
  'use cache'
  const {data} = await sanityFetch({
    query: ANNOUNCEMENT_DETAIL_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })
  return data
}

export default async function AnnouncementPage({params}: Props) {
  const {slug} = await params
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <Suspense>
        <AnnouncementDetailDynamic slug={slug} />
      </Suspense>
    </main>
  )
}

async function AnnouncementDetailDynamic({slug}: {slug: string}) {
  const opts = await getDynamicFetchOptions()
  return <AnnouncementDetailCached slug={slug} {...opts} />
}

async function AnnouncementDetailCached({
  slug,
  perspective,
  stega,
}: {slug: string} & DynamicFetchOptions) {
  'use cache'

  const {data: announcement} = await sanityFetch({
    query: ANNOUNCEMENT_DETAIL_QUERY,
    params: {slug},
    perspective,
    stega,
  })

  if (!announcement) notFound()

  return (
    <article>
      <header>
        <h1 className="text-4xl font-bold tracking-tight">{announcement.title}</h1>
        {announcement.publishedAt && (
          <time dateTime={announcement.publishedAt} className="mt-2 block text-gray-500">
            {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/New_York',
            })}
          </time>
        )}
      </header>

      {announcement.coverImage && (
        <SanityImage
          value={announcement.coverImage}
          width={800}
          height={400}
          className="mt-6 w-full rounded-lg object-cover"
        />
      )}

      {announcement.body && (
        <div className="prose mt-8">
          <PortableText value={announcement.body} />
        </div>
      )}

      <p className="mt-12">
        <Link href="/announcements" className="text-sm underline">
          &larr; All announcements
        </Link>
      </p>
    </article>
  )
}
