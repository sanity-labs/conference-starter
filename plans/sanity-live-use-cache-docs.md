# Sanity Live + `use cache` — Experimental Docs

**Source:** https://github.com/sanity-io/next-sanity/blob/cache-components/packages/next-sanity/EXPERIMENTAL-CACHE-COMPONENTS.md
**Install:** `pnpm install next-sanity@cache-components`
**Requires:** Next.js 16+ with `cacheComponents: true`

> ⚠️ CAUTION: Canary release, not yet stable. Breaking changes possible in minor/patch releases.

## Key Architecture: Three-Layer Component Pattern

With `cacheComponents: true`, `draftMode()` cannot be called inside `'use cache'` boundaries. The solution is a three-layer pattern:

1. **Sync page component** — renders `<Suspense>` with loading fallback
2. **Dynamic component** — calls `getDynamicFetchOptions()` to resolve `perspective` and `stega` outside cache boundary
3. **Cached component** — has `'use cache'` directive, receives `perspective` and `stega` as props (which become cache keys)

```tsx
// Layer 1: Sync page
export default function Page() {
  return (
    <Suspense fallback={<section>Loading…</section>}>
      <DynamicProductsList />
    </Suspense>
  )
}

// Layer 2: Dynamic (resolves perspective outside cache)
async function DynamicProductsList() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedProductsList perspective={perspective} stega={stega} />
}

// Layer 3: Cached (perspective + stega are cache keys)
async function CachedProductsList({perspective, stega}: DynamicFetchOptions) {
  'use cache'
  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params: {limit: 10},
    perspective,
    stega,
  })
  return <section>{/* render products */}</section>
}
```

## Setup

### 1. next.config.ts
```ts
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    sanity, // makes cacheLife('sanity') available
  },
}
```

### 2. defineLive + getDynamicFetchOptions
```tsx
import {defineLive, resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

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
```

### 3. Root layout with cache components
```tsx
export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <CachedLayout
      live={<SanityLive key="live" includeAllDocuments={isDraftMode} />}
      visualEditing={isDraftMode && <VisualEditing key="visual-editing" />}
    >
      {children}
    </CachedLayout>
  )
}

async function CachedLayout({children, live, visualEditing}) {
  'use cache'
  return (
    <html lang="en">
      <body>
        {children}
        {live}
        {visualEditing}
      </body>
    </html>
  )
}
```

### 4. generateMetadata with cache
```tsx
export async function generateMetadata({params}: Props): Promise<Metadata> {
  'use cache'
  const {slug} = await params
  const {data: product} = await sanityFetch({
    query: PRODUCT_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })
  return { title: product?.title }
}
```

## Key Details
- `sanityFetch` automatically calls `cacheTag()` and `cacheLife()` — no manual cache tag management
- Published and draft content get separate cache entries (perspective is a cache key)
- Metadata always uses `perspective: 'published'` and `stega: false`
- Working demo: https://template-nextjs-personal-website-git-use-cache.sanity.dev/

## Impact on D-012 (defineLive for Cache Revalidation)
This is the next evolution of D-012. Instead of just `defineLive()` + `SanityLive`, we now get `use cache` integration that makes pages blazing fast while maintaining live updates. The three-layer pattern is more code but the performance gains are significant.

**Requires Next.js 16** — this is a hard dependency. Our monorepo needs `next@16.0.0+`.
