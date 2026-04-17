# Web — Conference Website

Next.js 16 public-facing website for ContentOps Conf. Uses the App Router with `use cache` for fast, cached pages and Sanity Live for real-time preview.

## Stack

- **Next.js 16** — App Router, `use cache`, Turbopack dev
- **next-sanity** — `cache-components` canary for Sanity Live integration
- **Tailwind CSS 4** — styling with `@theme` semantic tokens + `.dark` mode overrides
- **Zod 4** — form validation (CFP submission)
- **React Email + Resend** — email preview and webhook handling
- **AI SDK v6** (`@ai-sdk/anthropic` + `@ai-sdk/mcp`) — concierge chat
- **self-hosted InterVariable** — typography with OpenType features (`cv02`, `cv03`, `cv04`, `cv11`, `ss01`, `ss03`)

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
| `/sponsors` | Sponsor grid grouped by tier (with anchor IDs for inbound linking) |
| `/venue` | Venue info, rooms with per-room schedules |
| `/faq` | FAQ grouped by category with `FAQPage` JSON-LD |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | AI concierge — MCP tools via Agent Context, Anthropic Sonnet, rate-limited via Sanity, persisted to `agent.conversation.web-*` |
| `/api/og` | GET | Dynamic OG image generation (`@vercel/og`) — session, speaker, and default cards |
| `/api/cfp/submit` | POST | CFP form submission (creates `submission` doc, honeypot validation) |
| `/api/draft-mode/enable` | GET | Enable draft mode for Visual Editing |
| `/api/draft-mode/disable` | GET | Exit draft mode |
| `/api/email-preview` | GET | Preview email templates (used by Studio) |
| `/api/send-test-email` | POST | Send test email to current user — gated by `STUDIO_SEND_SECRET` header |
| `/api/webhooks/resend` | POST | Resend webhook handler (bounces, complaints) — svix signature verified; fails closed in production if `RESEND_WEBHOOK_SECRET` is unset |

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
SANITY_API_WRITE_TOKEN=       # Editor token — used by /api/chat for rate-limit state and conversation persistence

# Email (for webhook handling + preview)
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=        # Svix secret; /api/webhooks/resend fails closed in production if unset
RESEND_FROM_ADDRESS=noreply@contentopsconf.dev
STUDIO_SEND_SECRET=           # Shared secret matching SANITY_STUDIO_SEND_SECRET in the Studio — gates /api/send-test-email

# AI concierge
ANTHROPIC_API_KEY=            # Direct provider, see D-024
SANITY_CONTEXT_MCP_URL=       # From the Agent Context document in Studio

# Optional
NEXT_PUBLIC_SITE_URL=         # Base URL for OG images and metadata
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

## Production hardening

- **Sanity-backed rate limiter** — `src/lib/rate-limit-sanity.ts` writes `chat.state.ratelimit.*` documents with `ifRevisionId` optimistic concurrency. In-memory burst guard (10 req / 10 s per instance) + Sanity fleet-wide window (100 req / 1 h). No Redis / KV. See D-023.
- **Conversation cap** — `/api/chat` caps `agent.conversation.web-*` message arrays at 100 entries via a splice in the append transaction.
- **Auth gates** — `/api/send-test-email` requires `x-studio-secret` when `STUDIO_SEND_SECRET` is set; `/api/webhooks/resend` requires a valid svix signature (fails closed in production).
- **CSP headers** — baseline `Content-Security-Policy-Report-Only` in `next.config.ts` covers Sanity CDN, Google Fonts, Anthropic API, MCP URL, Resend webhook origin. Promote to enforcing after a clean 24h of preview traffic.
- **Error boundaries** — root `app/error.tsx` plus route-level boundaries on `/cfp`, `/sessions`, `/announcements`.
- **Observability hook** — `src/instrumentation.ts` is a no-op by default. Wire OpenTelemetry / Sentry / logs there; see [`docs/observability.md`](../../docs/observability.md).

## Accessibility

Contrast contract + grep recipes in [`docs/accessibility.md`](../../docs/accessibility.md). The `text-on-muted` role token is an alias for `text-secondary` so muted-looking text on `surface-muted`/`surface-alt` stays AA in both themes. Before adding new text-on-background pairings, run the recipes in that doc.

## Key Files

```
src/
  app/                     → App Router pages and API routes
    error.tsx              → Root error boundary (richer than default)
    sessions/error.tsx     → Route-level boundary
    cfp/error.tsx          → Route-level boundary
    announcements/error.tsx→ Route-level boundary
    globals.css            → @theme tokens, .dark overrides, prose overrides (outside @layer base so they win cascade)
  components/
    header.tsx             → Site navigation (desktop below lg:)
    mobile-nav.tsx         → Hamburger + overlay (active below lg:)
    footer.tsx             → Site footer + ThemeToggle
    theme-toggle.tsx       → System / Light / Dark radio group, persists to localStorage
    concierge-chat.tsx     → Floating AI chat; yields to footer via IntersectionObserver
    sanity-image.tsx       → Image URL builder wrapper
    portable-text.tsx      → Portable Text renderer
    track-badge.tsx        → Filled track-color badge with YIQ-computed readable text
    json-ld.tsx            → Structured data (JSON-LD)
    sections/              → Page section components (hero, CTA, speaker grid, etc.)
  sanity/
    client.ts              → Sanity client initialization
    live.ts                → defineLive(), getDynamicFetchOptions(), sanityFetch
    token.ts               → API token
    image.ts               → Image URL builder config
  lib/
    metadata.ts            → OG image helpers, site constants
    rate-limit-sanity.ts   → Sanity-backed rate limiter for /api/chat
    portable-text-markdown.ts → Portable Text → markdown serializer (for /md routes)
  instrumentation.ts       → Observability extension point (no-op default)
public/
  fonts/
    InterVariable.woff2        → Self-hosted variable font
    InterVariable-Italic.woff2
```
