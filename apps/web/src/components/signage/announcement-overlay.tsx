import {sanityFetch} from '@/sanity/live'
import {ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY} from '@repo/sanity-queries'
import type {ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY_RESULT} from '@repo/sanity-queries'
import {AnnouncementOverlayClient} from './announcement-overlay-client'

export async function AnnouncementOverlay() {
  const {data} = await sanityFetch({
    query: ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY,
    perspective: 'published',
    stega: false,
  })

  const announcements = (data ?? []) as ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY_RESULT
  const latest = announcements[0]
  if (!latest) return null

  return <AnnouncementOverlayClient announcement={latest} />
}
