# Everything NYC 2026

A conference operations platform built on [Sanity](https://www.sanity.io) as a reference architecture. Not just a CMS-backed website — a **content operating system** for events where the Content Lake drives the website, emails, AI screening, Telegram ops bot, and automation.

Built for [Everything NYC 2026](https://everything.nyc), a Sanity conference.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Sanity Content Lake                    │
│         17 document types · GROQ · TypeGen              │
└────┬──────────┬──────────┬──────────┬──────────┬────────┘
     │          │          │          │          │
  Studio    Next.js    Functions   Bot      Emails
  (admin)   (public)   (events)  (Telegram) (Resend)
```

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 16 (App Router, `use cache`) |
| CMS | Sanity Studio (custom structure, schedule builder) |
| Queries | GROQ with end-to-end TypeGen |
| Email | React Email + Resend |
| Automation | Sanity Functions (Blueprints) — CFP screening, email triggers |
| AI | Sanity Agent Actions, Content Agent |
| Ops Bot | Telegram bot with Content Agent for organizer queries |
| Types | `sanity typegen` — schema to frontend type safety |

## Monorepo Structure

```
apps/
  web/                     → Next.js 16 conference website
  studio/                  → Sanity Studio + Functions + schedule builder
  bot/                     → Telegram ops bot (Content Agent)

packages/
  sanity-schema/           → Content model (16 document types)
  sanity-queries/          → GROQ queries + TypeGen types
  email/                   → React Email templates + Resend

plans/                     → Architecture docs, decisions, specs
scripts/                   → Seed data, migrations, utilities
```

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10.10+ (`corepack enable` to activate)
- A [Sanity](https://www.sanity.io) project (or use the included one: `yjorde43`)

### Install

```bash
pnpm install
```

### Environment Variables

Copy the `.env.example` files and fill in values:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/studio/.env.example apps/studio/.env.local
cp apps/bot/.env.example apps/bot/.env
```

See each app's README for details on required variables.

### Development

```bash
# Start everything (Studio on :3333, web on :3000)
pnpm dev

# Or run individual apps
pnpm --filter @repo/web dev
pnpm --filter @repo/studio dev
pnpm --filter @repo/bot dev
```

### Type Generation

Regenerate TypeScript types from the Sanity schema and GROQ queries:

```bash
pnpm typegen
```

This runs `sanity schema extract` and `sanity typegen generate`, producing `sanity.types.ts` in the queries package.

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

## Content Model

17 document types organized around conference operations:

| Type | Purpose |
|------|---------|
| `conference` | Singleton — event metadata, CFP config, branding, organizers |
| `person` | Speakers, organizers, staff (identity separate from role) |
| `session` | Unified type: keynote, talk, panel, workshop, lightning, break, social |
| `scheduleSlot` | Join document — links sessions to rooms and time slots |
| `track` | Color-coded session categories (Design, Backend, etc.) |
| `venue` | Physical location with rooms |
| `room` | Individual rooms within a venue |
| `sponsor` | Sponsors with tier levels (platinum, gold, silver) |
| `page` | Dynamic content pages with rich text sections |
| `announcement` | News items and updates |
| `submission` | CFP submissions with AI screening workflow |
| `emailTemplate` | Email designs with Portable Text body |
| `emailLog` | Email delivery audit trail |
| `prompt` | Editable AI instructions (live-edited, no publish workflow) |
| `chat.state` | Chat SDK state (subscriptions, locks, cache) |
| `agent.conversation` | Telegram bot conversation persistence |

The schema lives in `packages/sanity-schema/` and is consumed by all apps.

## Key Patterns

### Three-Layer `use cache` (Next.js 16)

Every page uses three layers for cached rendering with live preview:

1. **Sync page** — renders `<Suspense>` boundary
2. **Dynamic layer** — resolves `perspective` + `stega` outside cache
3. **Cached component** — `'use cache'` as first statement, fetches data

```tsx
// Layer 1
export default function Page() {
  return <Suspense fallback={<Loading />}><Dynamic /></Suspense>
}

// Layer 2
async function Dynamic() {
  const opts = await getDynamicFetchOptions()
  return <Cached {...opts} />
}

// Layer 3
async function Cached({ perspective, stega }: DynamicFetchOptions) {
  'use cache'
  const data = await sanityFetch({ query: QUERY, perspective, stega })
  return <Content data={data} />
}
```

### CFP Submission Workflow

```
Submitter fills form → submission created (status: submitted)
  → Function: send-cfp-confirmation (email)
  → Function: screen-cfp (AI scores with Agent Actions)
  → Organizer reviews in Studio
  → Document action: Accept (creates person + session) or Reject
  → Function: send-status-email (acceptance/rejection email)
```

### Visual Editing

Stega by default — ~80% of Visual Editing works automatically through CSM reference tracking. Use `createDataAttribute` only for non-text elements (images, dates, wrapper elements).

### GROQ Queries

All queries live in `packages/sanity-queries/` — never scattered in page components. TypeGen generates types for every query.

## Apps

| App | Port | README |
|-----|------|--------|
| [Web](apps/web/) | 3000 | [apps/web/README.md](apps/web/README.md) |
| [Studio](apps/studio/) | 3333 | [apps/studio/README.md](apps/studio/README.md) |
| [Bot](apps/bot/) | — | [apps/bot/README.md](apps/bot/README.md) |

## Packages

| Package | Description |
|---------|-------------|
| [`@repo/sanity-schema`](packages/sanity-schema/) | Content model — 17 document types, 9 object types |
| [`@repo/sanity-queries`](packages/sanity-queries/) | GROQ queries + TypeGen-generated types |
| [`@repo/email`](packages/email/) | React Email templates + Resend integration |

## Planning Documents

Detailed specs live in `plans/`:

- **`brief.md`** — Project brief, architecture, sprint plan
- **`masterplan.md`** — Vision, content model overview, feature roadmap
- **`content-model-spec.md`** — Complete schema specification with GROQ patterns
- **`decisions.md`** — 22 architecture decisions (D-001 through D-022)
- **`sanity-live-use-cache-docs.md`** — Three-layer cache component pattern
- **`content-agent-headless-api.md`** — AI concierge integration reference

## Architecture Decisions

Key decisions from `plans/decisions.md`:

- **D-001**: Luma for registration — Sanity syndicates to Luma, Luma webhooks sync back
- **D-002**: Unified `session` type with conditional fields (not separate types per format)
- **D-010**: Semantic HTML scaffolding — designers handle visual design later
- **D-014**: Visual Editing on everything, stega by default
- **D-015**: AI enhances, doesn't enable — platform works without AI features
- **D-016**: Next.js 16 + `use cache` with guardrails
- **D-021**: TypeGen in CI + targeted integration tests (no blanket UI testing)

## License

Private — built for Everything NYC 2026.
