'use client'

import {useEffect, useState} from 'react'
import type {ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY_RESULT} from '@repo/sanity-queries'

type Announcement = ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY_RESULT[number]

const DEFAULT_DURATION_SECONDS = 90
const DISMISSED_KEY_PREFIX = 'signage-overlay-dismissed:'

export function AnnouncementOverlayClient({announcement}: {announcement: Announcement}) {
  const [visible, setVisible] = useState(false)

  // Stable cache key per "version" of the announcement so re-publishing or
  // editing brings the overlay back even after a dismissal.
  const dismissKey = `${DISMISSED_KEY_PREFIX}${announcement._id}:${
    announcement.publishedAt ?? announcement._updatedAt ?? ''
  }`

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(dismissKey) === '1'
    } catch {}
    if (dismissed) return

    setVisible(true)

    const duration =
      (announcement.signageOverlayDurationSeconds ?? DEFAULT_DURATION_SECONDS) * 1000

    const timer = setTimeout(() => {
      setVisible(false)
      try {
        sessionStorage.setItem(dismissKey, '1')
      } catch {}
    }, duration)

    return () => clearTimeout(timer)
  }, [announcement.signageOverlayDurationSeconds, dismissKey])

  if (!visible) return null

  return (
    <div className="signage-overlay" role="alert" aria-live="polite">
      <div className="signage-overlay-card">
        <p className="signage-overlay-eyebrow">Announcement</p>
        <h2 className="signage-overlay-title">{announcement.title}</h2>
        {announcement.body && <p className="signage-overlay-body">{announcement.body}</p>}
      </div>
    </div>
  )
}
