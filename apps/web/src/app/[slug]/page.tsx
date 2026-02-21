import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {client} from '@/sanity/client'
import {PAGE_QUERY, PAGE_SLUGS_QUERY} from '@repo/sanity-queries'
import {PageSections} from '@/components/sections'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const pages = await client.fetch(PAGE_SLUGS_QUERY)
  return pages.map((p) => ({slug: p.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const page = await fetchPageForMetadata(slug)
  if (!page) return {}
  return {
    title: `${page.seoTitle || page.title} — Everything NYC 2026`,
    description: page.seoDescription || undefined,
  }
}

async function fetchPageForMetadata(slug: string) {
  'use cache'
  const {data} = await sanityFetch({
    query: PAGE_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })
  return data
}

export default async function PageRoute({params}: Props) {
  const {slug} = await params
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <Suspense>
        <PageDynamic slug={slug} />
      </Suspense>
    </main>
  )
}

async function PageDynamic({slug}: {slug: string}) {
  const opts = await getDynamicFetchOptions()
  return <PageCached slug={slug} {...opts} />
}

async function PageCached({
  slug,
  perspective,
  stega,
}: {slug: string} & DynamicFetchOptions) {
  'use cache'

  const {data: page} = await sanityFetch({
    query: PAGE_QUERY,
    params: {slug},
    perspective,
    stega,
  })

  if (!page) notFound()

  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
      <PageSections sections={page.sections} perspective={perspective} stega={stega} />
    </article>
  )
}
