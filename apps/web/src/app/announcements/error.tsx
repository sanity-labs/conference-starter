'use client'

import {useEffect} from 'react'
import Link from 'next/link'

export default function AnnouncementsError({
  error,
  reset,
}: {
  error: Error & {digest?: string}
  reset: () => void
}) {
  useEffect(() => {
    console.error('Announcements error boundary:', error)
  }, [error])

  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Announcements unavailable</h1>
      <p className="mt-4 text-pretty text-text-muted">
        We couldn't load announcements right now. You can still subscribe to the RSS feed to catch updates.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-text-muted">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Retry
        </button>
        <a href="/announcements/feed.xml" className="btn btn-secondary">
          RSS feed
        </a>
      </div>
    </main>
  )
}
