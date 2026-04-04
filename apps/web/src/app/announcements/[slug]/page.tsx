import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {client} from '@/sanity/client'
import {ANNOUNCEMENT_DETAIL_QUERY, ANNOUNCEMENT_SLUGS_QUERY} from '@repo/sanity-queries'
import {JsonLd} from '@/components/json-ld'
import type {NewsArticle} from 'schema-dts'
import {SITE_URL, createMetadata} from '@/lib/metadata'
import {Breadcrumbs} from '@/components/breadcrumbs'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const announcements = await client.fetch(ANNOUNCEMENT_SLUGS_QUERY)
  if (announcements.length === 0) return [{slug: '__placeholder__'}]
  return announcements.map((a) => ({slug: a.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const announcement = await fetchAnnouncementForMetadata(slug)
  if (!announcement) return {}
  const excerpt = announcement.body
    ? announcement.body.length > 160
      ? `${announcement.body.slice(0, 160)}…`
      : announcement.body
    : undefined
  return {
    ...createMetadata({
      title: announcement.title || 'Announcement',
      description: excerpt,
      path: `/announcements/${slug}`,
      type: 'article',
    }),
    openGraph: {
      type: 'article',
      ...(announcement.publishedAt && {publishedTime: announcement.publishedAt}),
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

const prefixMap: Record<string, string> = {
  session: '/sessions',
  person: '/speakers',
  venue: '/venue',
}

function resolveInternalHref(ref: {_type: string | null; slug: string | null}): string {
  const prefix = (ref._type && prefixMap[ref._type]) || ''
  return ref.slug ? `${prefix}/${ref.slug}` : prefix || '/'
}

export default async function AnnouncementPage({params}: Props) {
  const {slug} = await params
  return (
    <main id="main-content" className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-24">
      <div className="max-w-content">
        <Suspense>
          <AnnouncementDetailDynamic slug={slug} />
        </Suspense>
      </div>
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
      <Breadcrumbs
        items={[
          {name: 'Announcements', path: '/announcements'},
          {name: announcement.title ?? 'Announcement', path: `/announcements/${slug}`},
        ]}
      />
      <JsonLd<NewsArticle>
        data={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: announcement.title ?? undefined,
          url: `${SITE_URL}/announcements/${slug}`,
          ...(announcement.publishedAt && {datePublished: announcement.publishedAt}),
          ...(announcement.body && {description: announcement.body.slice(0, 200)}),
          author: {
            '@type': 'Organization',
            name: 'Sanity',
            url: 'https://www.sanity.io',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Sanity',
            url: 'https://www.sanity.io',
          },
        }}
      />
      <header>
        <h1 className="max-w-[30ch] text-3xl font-semibold tracking-tight sm:text-5xl">{announcement.title}</h1>
        {announcement.publishedAt && (
          <time dateTime={announcement.publishedAt} className="mt-2 block text-text-muted">
            {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/New_York',
            })}
          </time>
        )}
      </header>

      {announcement.body && (
        <p className="mt-8 text-text-secondary" style={{whiteSpace: 'pre-wrap'}}>
          {announcement.body}
        </p>
      )}

      {announcement.links && announcement.links.length > 0 && (
        <ul className="mt-6 space-y-1">
          {announcement.links.map((link, i) => {
            if (link._type === 'externalLink' && link.url) {
              return (
                <li key={i}>
                  <a
                    href={link.url}
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label || link.url} &rarr;
                  </a>
                </li>
              )
            }
            if (link._type === 'internalLink' && link.reference) {
              const href = resolveInternalHref(link.reference)
              return (
                <li key={i}>
                  <Link href={href} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    {link.label || link.reference.name || 'Link'} &rarr;
                  </Link>
                </li>
              )
            }
            return null
          })}
        </ul>
      )}

      <p className="mt-12">
        <Link href="/announcements" className="text-sm text-text-muted transition-colors hover:text-text-primary">
          &larr; All announcements
        </Link>
      </p>
    </article>
  )
}
