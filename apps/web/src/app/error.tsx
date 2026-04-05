'use client'

export default function Error({reset}: {error: Error; reset: () => void}) {
  return (
    <main id="main-content" className="mx-auto max-w-content px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-text-primary">Something went wrong</h1>
      <p className="mt-4 text-text-muted">An unexpected error occurred.</p>
      <button onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </main>
  )
}
