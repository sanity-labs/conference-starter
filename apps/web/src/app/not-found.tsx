import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-content px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-text-primary">Page not found</h1>
      <p className="mt-4 text-text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary mt-8 inline-block">
        Back to home
      </Link>
    </main>
  )
}
