# A Conference Operating System

> [!WARNING]
> This project is a work in progress. It's meant as inspiration and a reference architecture for building conference platforms on Sanity — it's not a production-ready starter kit... yet. APIs, patterns, and dependencies may change without notice.

A conference operations platform built on [Sanity](https://www.sanity.io) as a reference architecture. Not just a CMS-backed website — a **content operating system** for events where the Content Lake drives the website, emails, AI screening, Telegram bot, and automation.

## Features

- **Conference website** — Next.js 16 with App Router, `use cache`, and Visual Editing. Pages for speakers, sessions, schedule, sponsors, venue, announcements, CFP, and dynamic content pages.
- **Call for Proposals** — Public submission form with honeypot spam protection. AI-powered screening scores submissions using Agent Actions. Studio actions to accept (auto-creates speaker + session), reject, or re-screen.
- **Email pipeline** — Portable Text email templates with variable interpolation (`sanity-plugin-pte-interpolation`). Automated emails for CFP confirmation, acceptance/rejection, and announcement distribution. Preview and test-send from Studio.
- **Multi-channel announcements** — Publish an announcement in Studio and it distributes to email subscribers and a Telegram channel simultaneously, with per-channel delivery tracking.
- **Telegram bot (dual-mode)** — Organizer bot with Content Agent (read+write access to the Content Lake) for ops queries. Attendee bot with Anthropic Sonnet + Agent Context MCP (read-only) for public Q&A. Conversation persistence and auto-classification.
- **Schedule builder** — Custom Studio tool with drag-and-drop slot assignment and conflict detection.
- **7 serverless functions** — Event-driven Sanity Functions (Blueprints) for CFP screening, email sends, announcement distribution, conversation classification, and re-screening.
- **Visual Editing** — Stega-based click-to-edit across the entire website. Works automatically for ~80% of content through CSM reference tracking.
- **End-to-end type safety** — `sanity typegen` generates TypeScript types from schema and GROQ queries, consumed by all apps.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Sanity Content Lake                    │
│         17 document types · GROQ · TypeGen               │
└────┬──────────┬──────────┬──────────┬──────────┬─────────┘
     │          │          │          │          │
  Studio    Next.js    Functions   Bot      Emails
  (admin)   (public)   (events)  (Telegram) (Resend)
```

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 16 (App Router, `use cache`) |
| CMS | Sanity Studio (custom structure, schedule builder, 5 document actions) |
| Queries | GROQ with end-to-end TypeGen |
| Email | React Email + Resend + Portable Text interpolation |
| Automation | Sanity Functions (Blueprints) — 7 functions for CFP, email, announcements, classification |
| AI | Agent Actions (CFP screening), Content Agent (ops bot), Agent Context MCP (attendee bot) |
| Bot | Telegram — dual-mode: ops (Content Agent read+write) + attendee (Anthropic Sonnet + MCP) |
| Types | `sanity typegen` — schema to frontend type safety |

## Monorepo Structure

```
apps/
  web/                     → Next.js 16 conference website (11 pages, 6 API routes)
  studio/                  → Sanity Studio + Functions + schedule builder
  bot/                     → Telegram bot — dual-mode (ops + attendee)

packages/
  sanity-schema/           → Content model (17 document types, 9 object types)
  sanity-queries/          → GROQ queries + TypeGen types
  email/                   → React Email templates + Resend integration

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
| `room` | Individual rooms within capacity and location |
| `sponsor` | Sponsors with tier levels (platinum, gold, silver, bronze, community) |
| `page` | Dynamic content pages with composable sections |
| `announcement` | Multi-channel updates — distributes to email + Telegram with delivery tracking |
| `submission` | CFP submissions with AI screening (score, summary, scoredAt) |
| `emailTemplate` | Email designs with Portable Text body and variable interpolation |
| `emailLog` | Email delivery audit trail |
| `prompt` | Editable AI instructions (live-edited, no publish workflow) |
| `faq` | Categorized FAQ items |
| `agent.conversation` | Telegram bot conversation history with classification |
| `chat.state` | Chat SDK state persistence (subscriptions, locks, cache) |

The schema lives in `packages/sanity-schema/` and is consumed by all apps.

## Sanity Functions

7 event-driven serverless functions deployed as Blueprints:

| Function | Trigger | What it does |
|----------|---------|-------------|
| `screen-cfp` | Submission created | AI scores the submission using Agent Actions |
| `rescreen-cfp` | Submission status → "screening" | Re-evaluates a submission after organizer resets it |
| `send-cfp-confirmation` | Submission created | Sends confirmation email to submitter |
| `send-status-email` | Submission status changed | Sends acceptance or rejection email |
| `send-announcement-email` | Announcement status → "published" | Distributes announcement via Resend |
| `push-announcement-telegram` | Announcement status → "published" | Posts announcement to Telegram channel |
| `classify-conversation` | Conversation created/updated | Auto-classifies bot conversations (Anthropic Haiku) |

## Studio Customizations

### Document Actions

| Action | Schema type | What it does |
|--------|------------|-------------|
| Accept Submission | `submission` | Creates `person` + `session` documents, updates status to "accepted" |
| Reject Submission | `submission` | Updates status to "rejected", triggers email |
| Re-screen Submission | `submission` | Resets screening, re-triggers AI evaluation |
| Send Test Email | `emailTemplate` | Sends a preview email to the current user |
| Send Update | `announcement` | Publishes and distributes an announcement |

### Custom Structure

Studio navigation groups content by workflow: People (with travel status filters), Sessions (by type), Sponsors (by tier), CFP Submissions (by status), Announcements (by status), FAQs (by category), Email Templates, AI Prompts (singletons), and Agent Context configuration.

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

### Announcement Distribution

```
Editor writes announcement in Studio → sets status to "ready"
  → Document action: Send Update (publishes document)
  → Function: send-announcement-email (Resend to subscribers)
  → Function: push-announcement-telegram (posts to Telegram channel)
  → Distribution log updated per channel
```

### Visual Editing

Stega by default — ~80% of Visual Editing works automatically through CSM reference tracking. Use `createDataAttribute` only for non-text elements (images, dates, wrapper elements).

### GROQ Queries

All queries live in `packages/sanity-queries/` — never scattered in page components. TypeGen generates types for every query.

## Website Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with composable hero, CTA, speaker grid, schedule preview, sponsor bar |
| `/speakers` | Speaker grid |
| `/speakers/[slug]` | Speaker detail with linked sessions |
| `/sessions/[slug]` | Session detail with speaker, track, and schedule info |
| `/schedule` | Full schedule grid |
| `/cfp` | Call for Proposals submission form |
| `/announcements` | Announcement listing |
| `/announcements/[slug]` | Announcement detail |
| `/sponsors` | Sponsor listing by tier |
| `/venue` | Venue and room information |
| `/[slug]` | Dynamic catch-all for CMS-managed pages |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cfp/submit` | POST | CFP form submission with honeypot validation |
| `/api/email-preview` | GET | Email template preview (used by Studio) |
| `/api/send-test-email` | POST | Send test email to current user |
| `/api/webhooks/resend` | POST | Resend delivery event webhook (bounces, complaints) |
| `/api/draft-mode/enable` | GET | Enable Visual Editing draft mode |
| `/api/draft-mode/disable` | GET | Exit draft mode |

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

MIT
