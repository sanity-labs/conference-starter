'use client'

import {useEffect} from 'react'
import Link from 'next/link'

export default function CfpError({
  error,
  reset,
}: {
  error: Error & {digest?: string}
  reset: () => void
}) {
  useEffect(() => {
    console.error('CFP error boundary:', error)
  }, [error])

  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">CFP page unavailable</h1>
      <p className="mt-4 text-pretty text-text-muted">
        We couldn't load the Call for Proposals page. If you were mid-submission, your draft is safe in the form — reload and try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-text-muted">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Reload the form
        </button>
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </main>
  )
}
