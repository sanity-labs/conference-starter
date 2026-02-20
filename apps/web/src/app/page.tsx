// Layer 1: Sync page with Suspense — will use three-layer pattern once
// conference schema exists (Stage 5)
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">
        Everything NYC 2026
      </h1>
      <p className="mt-4 text-xl text-gray-600">
        Where developers and creative thinkers explore what it means to build
        digital experiences that move people forward.
      </p>
      <p className="mt-8 text-gray-500">
        Content will be loaded from Sanity once the schema is deployed.
      </p>
    </main>
  )
}
