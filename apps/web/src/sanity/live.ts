import {defineLive, resolvePerspectiveFromCookies} from 'next-sanity/live'
import type {LivePerspective} from 'next-sanity/live'
import {client} from './client'
import {token} from './token'
import {cookies, draftMode} from 'next/headers'

const live = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

export const sanityFetch: typeof live.sanityFetch = live.sanityFetch
export const SanityLive: typeof live.SanityLive = live.SanityLive

export interface DynamicFetchOptions {
  perspective: LivePerspective
  stega: boolean
}

export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return {perspective: 'published', stega: false}
  }
  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({cookies: jar})
  return {perspective: perspective ?? 'drafts', stega: true}
}
