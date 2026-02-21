import type {Metadata} from 'next'
import {sanityFetch} from '@/sanity/live'
import {urlForImage} from '@/sanity/image'
import {CONFERENCE_QUERY} from '@repo/sanity-queries'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://everything-nyc.sanity.dev'
export const SITE_NAME = 'Everything NYC 2026'

type ImageSource = {asset?: {_ref?: string; _type?: string} | null} | null | undefined

/**
 * Build a 1200x630 OG image URL from a Sanity image source.
 */
export function ogImageUrl(source: ImageSource): string | null {
  const builder = urlForImage(source)
  if (!builder) return null
  return builder.width(1200).height(630).fit('crop').url()
}

/**
 * Cached fetch of conference socialCard for use as a fallback OG image.
 */
export async function getDefaultOgImage(): Promise<string | null> {
  'use cache'
  const {data} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective: 'published',
    stega: false,
  })
  if (!data?.socialCard) return null
  return ogImageUrl(data.socialCard)
}

/**
 * Build a consistent Metadata object with OG and Twitter card defaults.
 */
export function createMetadata({
  title,
  description,
  ogImage,
  path,
  type = 'website',
}: {
  title: string
  description?: string | null
  ogImage?: string | null
  path?: string
  type?: 'website' | 'article' | 'profile'
}): Metadata {
  const url = path ? `${SITE_URL}${path}` : undefined

  return {
    title,
    ...(description && {description}),
    openGraph: {
      title,
      ...(description && {description}),
      ...(url && {url}),
      type,
      ...(ogImage && {images: [{url: ogImage, width: 1200, height: 630}]}),
    },
    ...(url && {alternates: {canonical: url}}),
  }
}
