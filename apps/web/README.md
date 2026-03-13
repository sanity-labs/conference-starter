# Web — Conference Website

Next.js 16 public-facing website for Everything NYC 2026. Uses the App Router with `use cache` for fast, cached pages and Sanity Live for real-time preview.

## Stack

- **Next.js 16** — App Router, `use cache`, Turbopack dev
- **next-sanity** — `cache-components` canary for Sanity Live integration
- **Tailwind CSS 4** — styling
- **Zod 4** — form validation (CFP submission)
- **React Email + Resend** — email preview and webhook handling

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, speaker grid, schedule preview, sponsors |
| `/cfp` | Call for Papers submission form |
| `/speakers` | Speaker grid with session counts |
| `/speakers/[slug]` | Speaker profile — bio, sessions, social links |
| `/sessions` | Session listing (excludes breaks/socials) |
| `/sessions/[slug]` | Session detail — abstract, speakers, schedule, materials |
| `/schedule` | Full schedule grid organized by day |
| `/announcements` | News and updates |
| `/announcements/[slug]` | Announcement detail |
| `/sponsors` | Sponsor grid grouped by tier |
| `/venue` | Venue info, rooms, logistics |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cfp/submit` | POST | CFP form submission (creates `submission` doc, honeypot validation) |
| `/api/draft-mode/enable` | GET | Enable draft mode for Visual Editing |
| `/api/draft-mode/disable` | GET | Exit draft mode |
| `/api/email-preview` | GET | Preview email templates |
| `/api/webhooks/resend` | POST | Resend webhook handler (bounces, complaints) |

## Three-Layer `use cache` Pattern

Every page follows this pattern for optimal caching with live preview support:

```tsx
// 1. Sync entry — renders Suspense boundary
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<Loading />}><Dynamic params={params} /></Suspense>
}

// 2. Dynamic — resolves perspective + stega OUTSIDE cache
async function Dynamic({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const opts = await getDynamicFetchOptions()
  return <Cached slug={slug} {...opts} />
}

// 3. Cached — 'use cache' MUST be first statement
async function Cached({ slug, perspective, stega }: Props & DynamicFetchOptions) {
  'use cache'
  cacheTag(`session:${slug}`)
  const data = await sanityFetch({ query: SESSION_DETAIL_QUERY, params: { slug }, perspective, stega })
  // render...
}
```

Published and draft content get separate cache entries via `perspective` as a cache key.

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SANITY_PROJECT_ID=yjorde43
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=        # Sanity API token with viewer role

# Email (for webhook handling + preview)
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
RESEND_FROM_ADDRESS=noreply@everything.nyc

# Optional
NEXT_PUBLIC_SITE_URL=         # Base URL for OG images and metadata
SANITY_API_WRITE_TOKEN=       # Only needed if writing from the web app
```

Copy from the example:

```bash
cp .env.example .env.local
```

## Development

```bash
# From monorepo root
pnpm --filter @repo/web dev

# Or from this directory
pnpm dev
```

Runs on [http://localhost:3000](http://localhost:3000) with Turbopack.

## Visual Editing

The site supports Sanity Visual Editing via Presentation Tool:

1. Open Studio at `localhost:3333`
2. Click "Presentation" in the top nav
3. Navigate the website with click-to-edit overlays

Stega encoding handles ~80% of fields automatically. Non-text elements (images, dates) use `createDataAttribute` for overlay placement.

Metadata (`generateMetadata`) always uses `perspective: 'published'` and `stega: false`.

## Key Files

```
src/
  app/                     → App Router pages and API routes
  components/
    header.tsx             → Site navigation
    footer.tsx             → Site footer
    sanity-image.tsx       → Image URL builder wrapper
    portable-text.tsx      → Portable Text renderer
    json-ld.tsx            → Structured data (JSON-LD)
    sections/              → Page section components (hero, CTA, speaker grid, etc.)
  sanity/
    client.ts              → Sanity client initialization
    live.ts                → defineLive(), getDynamicFetchOptions(), sanityFetch
    token.ts               → API token
    image.ts               → Image URL builder config
  lib/
    metadata.ts            → OG image helpers, site constants
```
