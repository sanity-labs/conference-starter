# Detailed Project Brief: ContentOps Conf Conference Platform

> [!NOTE]
> **Historical planning artifact.** This brief captures the sprint plan, team assignments, and scope-of-work agreements from the project's kickoff. It is preserved as a record of how the project was planned, not as a description of current state. For what's shipped today see the root [README](../README.md); for architectural decisions taken since (including ones not covered here), see [decisions.md](decisions.md).
>
> Sprint reality check: Sprints 0–4 and the Polish Sprint are complete. Sprint 5 (Content Releases / archive) and Sprint 6 (Luma) remain open. The `@forger` / `@anvil` / `@sentinel` / `@beacon` / `@catalyst` names are AI-agent personas from the planning phase.

> **Status (at authoring):** READY FOR REVIEW — All team input incorporated
> **Goal:** Build the definitive conference platform on Sanity — both a real product for ContentOps Conf and a showcase/demo of Sanity's full capabilities.
> **MVP Launch:** Landing page + CFP submission page. Full site builds out from there.
> **URL Structure:** Current year at root (`contentopsconf.dev/`), past years at `/YYYY/` paths. Post-conference, content becomes an archive with recordings attached.

---

## 1. Project Overview

### What We're Building
A complete conference operations platform where Sanity is the backbone for everything:
- **Conference website** (Next.js + Visual Editing)
- **Organizer tools** (Studio + App SDK custom apps)
- **Automation layer** (Functions + Agent Actions)
- **Email system** (Resend + React Email)
- **Registration** (Luma integration — syndication pattern)
- **CFP system** (submission form + AI pre-screening)
- **AI features** (Content Agent + Agent Actions + Content Agent Headless API)

### What This Is NOT
- Not just a conference website template
- Not a generic event platform — it's purpose-built for ContentOps Conf
- Not a ticketing platform (we integrate with Luma for registration)

### Success Criteria
1. Powers the actual ContentOps Conf conference
2. Demonstrates every major Sanity capability in a real-world context
3. Serves as a reference architecture other developers can learn from
4. Content model is a showcase of Sanity best practices

---

## 2. Architecture Decisions

### ADR-001: Registration & Ticketing — Luma + Sanity Syndication

**Decision:** Use Luma for registration and ticketing. Sanity is the single source of truth for event content, syndicating *to* Luma via its API. Luma webhooks sync registration data *back* to Sanity.

**Rationale:**
- **Luma handles what it's good at** — registration UX, payments, reminders, check-in
- **Sanity stays the single source of truth** for all event *content* (talks, speakers, schedule, sponsors)
- **Demonstrates a powerful "Content Syndication" pattern** — Sanity → Luma (and potentially → Eventbrite, Meetup, etc.)
- **Luma has a comprehensive API** — Create Event, Update Event, Create Ticket Types, Manage Guests, Webhooks
- **This is a better Sanity story** — "Power anything" in action. Content Lake drives the conference site AND populates Luma AND could feed any other platform

**The Syndication Pattern (this is the showcase piece):**
```
┌─────────────────────────────────────────────────┐
│              SANITY CONTENT LAKE                 │
│         (Single Source of Truth)                 │
│                                                  │
│  Talks, Speakers, Schedule, Sponsors, Venues     │
└──────┬──────────────┬──────────────┬─────────────┘
       │              │              │
  Sanity Function  Sanity Function  Next.js
  (on publish)     (on publish)     (ISR/Live)
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐   ┌──────────┐   ┌──────────┐
  │  Luma   │   │Eventbrite│   │Conference│
  │(tickets,│   │ (future) │   │ Website  │
  │ reg)    │   │          │   │          │
  └────┬────┘   └──────────┘   └──────────┘
       │
  Luma Webhook
  (guest.registered,
   ticket.registered)
       │
       ▼
  ┌─────────────────────────────────────────┐
  │  Next.js API Route → Sanity Mutation    │
  │  (attendee record in Content Lake)      │
  └─────────────────────────────────────────┘
```

**How it works — Sanity → Luma (outbound sync):**
1. Conference organizer creates/edits event content in Sanity Studio
2. Sanity Function triggers on publish of conference/talk/workshop documents
3. Function calls Luma API to create/update the event:
   - `POST /v1/event/create` — create event with name, description (markdown), dates, venue, capacity
   - `POST /v1/event/update` — sync changes (with `suppress_notifications` option)
   - `POST /v1/event/ticket-types/create` — sync ticket types (free/paid, capacity, validity dates)
   - `POST /v1/event/hosts/create` — sync speaker/host info
4. Luma `event_api_id` stored back on the Sanity document for future syncs

**How it works — Luma → Sanity (inbound sync):**
1. Luma webhooks configured: `guest.registered`, `ticket.registered`, `guest.updated`
2. Webhooks hit Next.js API route (Luma needs HTTP endpoint, same pattern as Stripe)
3. API route creates/updates attendee documents in Sanity Content Lake
4. Sanity Functions trigger on attendee creation → send custom emails via Resend, update counts

**Luma API capabilities we'll use:**
| Endpoint | Purpose |
|----------|---------|
| `POST /v1/event/create` | Create events from Sanity content |
| `POST /v1/event/update` | Sync content changes to Luma |
| `POST /v1/event/ticket-types/create` | Sync ticket types and pricing |
| `POST /v1/event/ticket-types/update` | Update pricing, capacity, dates |
| `GET /v1/event/get-guests` | Pull attendee lists (with pagination, sorting, filtering by status) |
| `POST /v1/event/hosts/create` | Sync speakers as event hosts |
| `POST /v1/event/add-guests` | Add comp tickets (speakers, sponsors, staff) |
| `POST /v1/event/create-coupon` | Sync discount codes |
| Webhook: `guest.registered` | Real-time registration sync to Sanity |
| Webhook: `ticket.registered` | Ticket purchase sync to Sanity |
| Webhook: `guest.updated` | Status changes (approved, declined, waitlist) |

**Why this is a better story than building our own ticketing:**
- Shows Sanity as a **content operations platform**, not just a CMS
- Demonstrates the **"Power anything"** pillar — same content drives website, Luma, and potentially other platforms
- The syndication pattern is **reusable** — swap Luma for Eventbrite, add Meetup, etc.
- Sanity Functions as the **automation glue** between systems
- Attendee data flows back to Sanity, enabling **personalized content** (my schedule, recommendations)

**Ticket types to support (defined in Sanity, synced to Luma):**
- Early Bird / Regular / Late
- VIP (includes workshop access, front-row, speaker dinner)
- Workshop-only
- Student / Diversity
- Group discounts
- Complimentary (speakers, sponsors, staff — via `add-guests` API)

### ADR-002: Email — Resend + React Email

**Decision:** Use Resend for all email delivery with React Email for templates.

**Rationale:**
- Modern, developer-friendly API
- React Email = email templates as React components (matches our Next.js stack)
- Supports batch sending (up to 100 per API call), broadcasts via segments
- Scheduled sending supported
- Great deliverability

**Architecture:**
- Email content (subject, body structure, audience rules) lives in Sanity as structured content
- React Email templates render the visual layout
- Sanity Functions trigger sends based on document events
- Resend Segments for audience management (all attendees, speakers, sponsors, track-specific)
- Delivery status tracked back in Sanity

**Key Resend features we'll use:**
- `batch.send()` — for bulk sends (100 per call, loop for larger audiences)
- Broadcasts + Segments — for marketing emails and announcements
- `scheduledAt` — for timed sends (reminders)
- Webhooks — delivery/bounce tracking back to Sanity

> **📝 Email rendering note:** `@portabletext/react` can absolutely serialize to tables and inline styles — you provide custom components that output email-compatible HTML. No separate serializer library needed, just email-specific component overrides. This is a clean pattern: same Portable Text content, different rendering targets (web vs. email).

### ADR-003: Frontend — Next.js 16 + `use cache` + Visual Editing

**Decision:** Next.js 16 (latest stable) with App Router, `next-sanity@cache-components` (canary), and Visual Editing via stega.

**Architecture:** Three-layer component pattern per D-016:
1. Sync page with `<Suspense>` boundaries
2. Dynamic layer resolving `perspective`/`stega` via `getDynamicFetchOptions()` (outside cache)
3. Cached component with `'use cache'` receiving perspective as cache key

`sanityFetch` auto-manages `cacheTag()` and `cacheLife('sanity')` — 365-day revalidation, Sanity Live handles all invalidation on-demand. No stale windows.

**Key packages:**
- `next-sanity@cache-components` — Sanity integration with `use cache` support (canary)
- `@sanity/image-url` — Image URL builder
- `@sanity/visual-editing` — Stega encoding for click-to-edit (CSM handles ~80% automatically)
- `@sanity/client` — GROQ queries
- `sanity` — Studio + `sanity typegen` for auto-generated TypeScript types
- `@react-email/*` — Email templates
- `resend` — Email sending

**Guardrails (D-016):** `createPage` helper for boilerplate, pinned canary version, vanilla `defineLive()` fallback documented and tested, Next.js 16 version check.

> **⚠️ Don't skip TypeGen** (from @sentinel): `sanity typegen` generates TypeScript types from both schemas and GROQ queries. End-to-end type safety from schema to frontend. Non-negotiable for a reference architecture.

### ADR-004: Sanity Functions for Automation

**Decision:** Use Sanity Functions (with Blueprints) as the primary automation layer.

**What Functions handle:**
- Document event triggers (speaker confirmed, talk scheduled, etc.)
- Luma sync (push event data on publish, pull attendee data on schedule)
- Email sending orchestration
- Agent Actions invocation (AI content generation)
- Next.js ISR revalidation on publish (replaces external webhooks — fewer moving parts)
- Data sync and integrity checks

**What Scheduled Functions handle (when available):**
- Pre-event reminder emails
- Daily digest during event
- Post-event follow-up sequence
- Ticket sync / capacity checks
- CFP deadline reminders

**GROQ Delta Functions for efficient triggers:**
Functions use delta functions (`before()`, `after()`, `delta::changedAny()`, `delta::changedOnly()`) to filter triggers precisely — only fire when relevant fields change. This prevents wasted invocations and infinite loops. Example: "only trigger Luma sync when session title, description, or time changes — not when an editor updates internal notes."

**Blueprint structure:**
```
sanity.blueprint.ts
├── on-speaker-confirmed      (document event — delta: status changed to 'confirmed')
├── on-session-published       (document event — sync to Luma)
├── on-schedule-change         (document event — delta: time/track/room changed)
├── on-attendee-created        (document event — from Luma webhook handler)
├── on-email-queued            (document event)
├── on-recording-added         (document event)
├── generate-seo-metadata      (document event — on session publish)
├── luma-attendee-sync         (scheduled — when available, fallback: Vercel Cron)
├── pre-event-reminders        (scheduled — when available, fallback: Resend scheduledAt)
├── daily-digest               (scheduled — when available, fallback: Vercel Cron)
└── post-event-followup        (scheduled — when available, fallback: Resend scheduledAt)
```

> **Note on scheduled functions:** Not yet available as of Feb 2026. Fallback strategies: Resend's `scheduledAt` (up to 30 days) for email timing, Vercel Cron for periodic jobs like attendee sync.

### ADR-005: AI Concierge — Content Agent Headless API (Primary) + agent-context (Fallback)

**Decision:** Build the AI concierge using Content Agent Headless API (preview, `vX`) as primary path, with `@sanity/agent-context` as fallback. Thin abstraction wrapper (~20 lines) for swappability.

**Architecture (D-009):**
1. Next.js proxy route with rate limiting (20 msg/min per session) + cost logging
2. `useChat()` from Vercel AI SDK on frontend — Content Agent API is SSE-compatible
3. Start with one-shot `/prompt` endpoint (stateless). Threads in Phase 2.
4. GROQ filter: `_type in ["session", "speaker", "track", "venue", "sponsor"]` — server-side data boundary
5. Locked to `published` perspective — concierge never sees drafts
6. `@sanity/agent-context` as fallback if preview API proves unstable

**Example interactions:**
- "What React talks are on Day 2?" → grounded in real schedule data
- "Tell me about Sarah Chen's talk" → speaker + session from Content Lake
- "What workshops still have space?" → capacity data
- "What's the WiFi password?" → FAQ/logistics content

**Why this is a showcase piece:**
- Content Agent API is purpose-built for Q&A over structured content
- GROQ filters are server-side data boundaries (not prompt-level — can't be jailbroken)
- ~half day to working chatbot with `useChat()`. Remarkable effort-to-demo-value ratio.
- Reusable pattern: any content-heavy site could add an AI concierge this way

**Sprint 6 acceptance criteria:** GROQ filter security verification, reference chain traversal quality, time-to-first-token latency < 2s.

**Principle (D-015):** AI enhances, it doesn't enable. The schedule page works fine without the concierge. The concierge makes it 10x better.

### ADR-006a: Call for Papers (CFP) — Submission Form + AI Pre-Screening

**Decision:** Build a public CFP submission form that creates `submission` documents in Sanity. AI pre-screens submissions against editorial criteria via Sanity Function + Agent Actions.

**Architecture:**
- **Public form** → Next.js API route → `client.create({ _type: 'submission' })` with write token (never exposed to browser)
- **AI screening** → Sanity Function triggers on submission create → Agent Actions `prompt` scores against `cfpCriteria` on the `conference` document → writes `aiScreening` object back to submission
- **Editorial review** → Editors review AI-scored submissions in Studio, accept/reject
- **Acceptance transform** → Studio document action creates `session` + `speaker` documents from accepted submission (one-way transform, not sync)

**Submission status flow:** `submitted` → `screening` → `scored` → `in-review` → `accepted` / `rejected` / `withdrawn`

**Security:** Rate limiting (IP-based + honeypot), input validation (zod), scoped write token, no direct Content Lake access from browser.

**CFP criteria** live on the `conference` document in a "CFP" field group: `cfpOpen`, `cfpDeadline`, `cfpGuidelines` (PTE for public form), `scoringCriteria` (editorial lever the AI scorer reads).

**Why this is a showcase:** Demonstrates the full Sanity AI pipeline — structured content in, AI evaluation, editorial workflow, content transformation. The "AI enhances, doesn't enable" principle in action: editors can review without AI, but AI pre-screening saves hours on 100+ submissions.

### ADR-006b: Post-Conference Archive + Year-Based Routing

**Decision:** Current conference year at root domain (`contentopsconf.dev/`), past years at `/YYYY/` paths. Post-conference, content becomes an archive with recordings attached.

**Architecture:**
- `conference` document has a `status` field: `upcoming` → `live` → `archived`
- `session` gets a `recording` field (video URL — Mux or similar) populated post-conference
- Frontend renders differently based on conference status — schedule page becomes on-demand video library
- URL routing: `/` = current year, `/2026/` = 2026 archive, etc.
- Content Releases showcase: flip conference from "live" to "archived" atomically (sessions + recordings + updated pages in one release)

**Content model impact:** Minimal — `status` on `conference`, `recording` on `session`, routing logic in Next.js.

### ADR-006: Unified Session Type (not separate Talk/Workshop/Panel types)

**Decision:** Use a single `session` document type with a `sessionType` field and conditional fields, not separate document types per format.

**Rationale (from @forger + @sentinel):**
- One GROQ query to get all sessions: `*[_type == "session"]`
- Content Releases don't need to know about multiple types
- Schedule slots reference one type, not a union
- Filtering by type is trivial: `*[_type == "session" && sessionType == "workshop"]`
- Conditional fields in Studio: `hidden: ({document}) => document?.sessionType !== 'workshop'`

**Session types supported:**
- `keynote` — single speaker, main stage, no parallel sessions
- `talk` — standard conference talk (30-45 min)
- `panel` — multiple speakers, moderator, discussion format
- `workshop` — hands-on, limited capacity, prerequisites, materials list
- `lightning` — short talk (5-10 min)
- `break` — coffee, lunch, networking (no speakers)
- `social` — parties, meetups, sponsor events

**Conditional fields by type:**
| Field | keynote | talk | panel | workshop | lightning | break | social |
|-------|---------|------|-------|----------|-----------|-------|--------|
| speakers[] | ✅ | ✅ | ✅ | ✅ (as instructors) | ✅ | ❌ | ❌ |
| moderator | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| capacity | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| prerequisites | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| materials | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| level | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| venue override | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

### ADR-007: Content Model Philosophy

**Decision:** The content model is a first-class deliverable, not just scaffolding.

**Principles:**
- **References over duplication** — A speaker is referenced from talks, not embedded
- **Structured over freeform** — Use specific fields, not catch-all rich text
- **Validation with empathy** — Error messages that help, not scold
- **Descriptions that teach** — Every field has a description useful for humans AND Content Agent
- **Query-friendly** — Model designed with GROQ query patterns in mind
- **Editorial workflow** — Status fields, draft/published, Content Releases support

---

## 3. Sprint Plan

> **MVP Launch target:** Landing page + CFP submission page. Full site builds out from there.
> **Principle (D-015):** Platform works without AI. Sprints 0-4 build the platform, Sprint 5 layers AI + Content Releases. Sprint 6 adds Luma integration (external dependency last).
> **Sprint reorder rationale (D-020):** Luma integration moved to last — gnarliest external dependency, hardest to test. Internal systems (email, AI, Releases) proven first, so Luma sync is "just another Function" by Sprint 6.

### Testing & Validation Strategy (D-021)

Four-layer feedback loop:

| Layer | What | How | When |
|-------|------|-----|------|
| **Type safety** | Schema↔query mismatches | TypeGen in CI — build fails on drift | Every push |
| **Integration tests** | Data boundary correctness | Targeted tests on API routes, Functions, email rendering | Every push |
| **Staging URL** | Functional validation | Vercel preview deploys on every push to `main` — @knut always has a current URL | Continuous |
| **Sprint checkpoints** | Stakeholder + DX review | @knut hands-on in Studio + site. @beacon DX gate review. | Sprint boundaries |

**What we DON'T do:** Blanket UI testing, continuous QA click-throughs, or test coverage mandates. TypeGen + targeted integration tests + staging URL + human review is the right balance for a reference architecture.

**@beacon's 6 DX gates (periodic, not continuous):**
1. Sprint 0: `createPage` helper — new page in < 30 seconds?
2. Sprint 1: Cold clone test — running in < 2 minutes?
3. Sprint 2: Content Agent description validation with real data
4. Sprint 5: Release Dependency Resolver UX review
5. Sprint 5: Concierge validation (GROQ filter security, reference traversal, TTFT < 2s)
6. End: Platform feedback report (code issues vs. platform issues)

### Sprint 0: Project Setup (3 days)
**Goal:** Dev environment, repo, tooling, and team alignment.

| Task | Owner | Details |
|------|-------|---------|
| Create monorepo structure | @forger | Turborepo: `/apps/web`, `/apps/studio`, `/packages/sanity-schema`, `/packages/sanity-queries`, `/packages/email`, `/functions` |
| Sanity project setup | @sentinel | Create project, dataset, configure CORS, API tokens |
| Next.js 16 scaffold | @forger | App Router, `next-sanity@cache-components`, TypeScript, Tailwind |
| `createPage` helper | @forger | Scaffolds three-layer `use cache` pattern (~2h) |
| `defineLive()` fallback | @forger | Documented + tested vanilla path (~1h) |
| Version check script | @forger | `pnpm dev` fails fast if wrong Next.js version (~1h) |
| Resend account + domain | @forger | DNS setup, API keys, test sending |
| CI/CD pipeline | @forger | GitHub Actions: lint, type-check, build, deploy |
| Release Actions UI spike | @forger | 2h timeboxed — where to mount resolver UI |

**Deliverable:** Running dev environment with Next.js 16 + `use cache` working.

---

### Sprint 1: Content Model + Studio Foundation (1 week)
**Goal:** Complete content model implemented in Sanity with great editorial experience.

| Task | Owner | Details |
|------|-------|---------|
| Schema implementation | @eventide + @forger | 10 core types + 8 object types from approved spec |
| Custom validation rules | @eventide | Double-booking, session uniqueness, panel speaker minimum, helpful messages |
| Field descriptions | @eventide | Triple-duty: editors, Content Agent, developers |
| CFP fields on conference | @eventide | `cfpOpen`, `cfpDeadline`, `cfpGuidelines`, `scoringCriteria` (field group) |
| `submission` document type | @eventide | CFP submissions with `aiScreening` object |
| Studio structure | @sentinel | Custom sidebar, document lists, filtered views |
| List previews | @sentinel | Custom preview components for key types |
| TypeGen setup | @forger | `sanity typegen` generating types from schemas + GROQ queries |
| Seed data | @eventide | Realistic test data for development |
| GROQ query patterns | @sentinel + @forger | Key queries in `packages/sanity-queries` |

**Deliverable:** Studio with full content model, seed data, and great editing experience.

**Validation checkpoint:** @knut reviews Studio experience, edits content, provides feedback. @beacon validates Content Agent descriptions against real schema.

---

### Sprint 2: Core Website + CFP Page (1 week)
**Goal:** Landing page + CFP submission form (MVP launch). Core conference pages with Visual Editing.

| Task | Owner | Details |
|------|-------|---------|
| Landing page | @forger | Hero, featured speakers, schedule preview, sponsors, CTA |
| **CFP submission page** | @forger | Public form → API route → `submission` document in Sanity |
| **CFP API route** | @forger | Zod validation, rate limiting, honeypot, scoped write token |
| Schedule page | @forger | Multi-track grid, day tabs, filtering, responsive |
| Speaker listing + detail | @forger | Grid with photos, bio, talks, social links |
| Session detail | @forger | Abstract, speaker(s), track, time, related sessions |
| Sponsor page | @forger | Tier-based layout |
| Venue page | @forger | Map, rooms, logistics info |
| Visual Editing (stega) | @forger | Stega by default, `createDataAttribute` only for non-text |
| SEO foundations | @forger | Meta tags, OG images, structured data (JSON-LD) |

**Deliverable:** Launchable MVP (landing + CFP) + full conference website with Visual Editing.

**Validation checkpoint:** @knut edits content via Visual Editing, submits a test CFP proposal, reviews all pages.

---

### Sprint 3: Email Pipeline + CFP AI Screening (1 week)
**Goal:** Automated email pipeline + AI-powered CFP screening. All internal systems — no external API dependencies.

| Task | Owner | Details |
|------|-------|---------|
| `emailTemplate` document type | @eventide | Subject, body (PT), audience, trigger |
| React Email base templates | @anvil | Branded components (header, footer, CTA) with PT rendering |
| **CFP scoring Function** | @sentinel + @anvil | On submission create → Agent Actions `prompt` → scores against `cfpCriteria` → writes `aiScreening`. Zod validation on AI output. |
| **CFP "Accept" document action** | @forger | Creates `session` + `speaker` from accepted submission |
| **CFP "Re-screen" document action** | @forger | Manual re-trigger of AI scoring |
| Speaker acceptance email | @anvil | Triggered by Function on speaker status change |
| Schedule change notification | @anvil | Triggered by Function on schedule slot update |
| Pre-event reminder emails | @anvil | Resend `scheduledAt` (up to 30 days) |
| Email status tracking | @sentinel | Delivery/bounce webhooks back to Sanity |
| Sanity Functions: Blueprints | @sentinel | All document event triggers defined |

**Deliverable:** Automated emails + AI-scored CFP submissions with editorial accept/reject workflow. Functions infrastructure proven on internal systems.

**Validation checkpoint:** Submit CFP → AI scores it → editor reviews → accepts → session created. Trigger each automated email.

---

### Sprint 4: AI Features + Content Agent (1 week)
**Goal:** AI-powered content operations and attendee experience.

| Task | Owner | Details |
|------|-------|---------|
| Agent Actions: SEO metadata | @sentinel + @anvil | Auto-generate meta descriptions, OG tags on publish |
| Agent Actions: Talk summaries | @sentinel + @anvil | Generate short summaries from full abstracts |
| Agent Actions: Speaker social cards | @sentinel + @anvil | Generate social media text for each speaker |
| Content Agent workflows | @sentinel | Bio enhancement, abstract improvement prompts |
| **AI Concierge** | @sentinel + @forger | Content Agent Headless API + `useChat()`, Next.js proxy with rate limiting |
| **Bulk Operation Log** | @eventide + @anvil | Track AI operations (who, what, when, cost) — P-005 |
| **AI guardrails** | @anvil | Confirmation UI for bulk ops, rate limiting, cost benchmarking |
| GROQ semantic search | @sentinel | "Find talks about accessibility" |

**Deliverable:** AI features working end-to-end in Studio and on the website. Cost guardrails as first-class features.

**Validation checkpoint:** Demo AI concierge, review generated content quality, verify GROQ filter security, benchmark AI Credits cost.

---

### Sprint 5: Content Releases + Archive (1 week)
**Goal:** Editorial workflows for coordinated publishing + post-conference archive support.

| Task | Owner | Details |
|------|-------|---------|
| Content Releases workflows | @sentinel | "Speaker Wave 1", "Schedule Reveal", "Post-Event Archive" release patterns |
| **Release Dependency Resolver** | @forger | Studio tool per spec: auto-detect refs, diff view, "add all missing", publish blocking |
| `conference.status` workflow | @eventide | `upcoming` → `live` → `archived` with Content Release |
| `session.recording` field | @eventide | Video URL for post-conference archive |
| **Year-based routing** | @forger | `/` = current year, `/YYYY/` = archive. Archive pages show recordings. |
| Structured error handling | @anvil + @sentinel | Standard FunctionError type with severity + correlationId |
| Sentry integration | @anvil | Error tracking for Functions alongside native logs |

**Deliverable:** Editors can safely bundle and publish coordinated content updates. Archive path ready for post-conference.

**Validation checkpoint:** Create a "Speaker Wave" release with 5 sessions + speakers, verify dependency resolver catches missing refs, publish atomically. Test archive routing.

---

### Sprint 6: Luma Integration + Registration Sync (1 week)
**Goal:** Sanity → Luma syndication working. Registration data flowing back. External dependency tackled last — Functions infrastructure already proven over 3 sprints.

| Task | Owner | Details |
|------|-------|---------|
| `attendee` document type | @eventide | Name, email, ticket type, Luma guest ID, dietary, etc. |
| `ticketType` document type | @eventide | Synced to Luma: name, price, capacity, validity dates |
| Luma sync Function | @anvil + @sentinel | On session/event publish → Luma API (create/update event, ticket types, hosts). GROQ delta triggers for efficiency. |
| Luma webhook handler | @anvil | Next.js API route: `guest.registered` + `ticket.registered` → attendee record in Sanity |
| Luma sync status | @anvil | Read-only object on event docs: `{ status, lastSyncedAt, lumaEventId }` |
| Comp ticket flow | @sentinel + @anvil | Luma `add-guests` API for speakers, sponsors, staff |
| Attendee data pull | @anvil | Periodic guest list sync (Vercel Cron — scheduled Functions not yet available) |

**Deliverable:** Edit event in Sanity → appears in Luma. Register on Luma → attendee record in Sanity.

**Validation checkpoint:** Full round-trip: publish session → Luma event created → register → attendee in Sanity.

> **Note:** Luma API key (P-004) needed before Sprint 6. @knut to provide during Sprint 3-4 so @anvil can explore the API shape ahead of implementation.

---

### 🚀 SHIP & VALIDATE CHECKPOINT

> **Team consensus:** Ship Sprints 0-6 as a tight, polished core. Validate with real users and @knut before committing to Phase 2. A polished Phase 1 beats a half-built Phase 1-10.

---

## Phase 2 (Post-Validation — scope TBD based on learnings)

### Sprint 7: App SDK Custom Apps
**Goal:** Purpose-built tools for conference organizers — only if validated as needed.

| Task | Owner | Details |
|------|-------|---------|
| Schedule Builder app | @forger | Drag-and-drop grid: assign talks to slots/tracks/rooms |
| CFP Review Board | @forger | Kanban for submissions: submitted → scored → in-review → accepted/rejected |
| Email Campaign Manager | @forger | Preview emails with real data, select audience, schedule |
| Analytics Dashboard | @forger | Registration trends, session popularity, capacity |

> **Gate:** Do organizers actually need these vs. editing in Studio? Validate before building.

### Sprint 8: Personal Schedule + Attendee Features
**Goal:** Authenticated attendee experience.

| Task | Owner | Details |
|------|-------|---------|
| Attendee auth | @forger | Magic link via Resend (D-007) |
| My Schedule | @forger | Bookmark talks, build personal schedule |
| Schedule conflict detection | @forger | Warn when bookmarking overlapping sessions |
| Add-to-calendar | @forger | .ics download, Google Calendar link |
| Threaded concierge | @forger + @sentinel | Upgrade from one-shot to threaded conversations |
| PWA support | @forger | Installable app for on-site use |

### Sprint 9-10: Polish, Documentation + Launch
**Goal:** Production-ready reference architecture.

| Task | Owner | Details |
|------|-------|---------|
| Performance optimization | @forger | Core Web Vitals, image optimization |
| Accessibility audit | @forger + @beacon | WCAG 2.1 AA compliance |
| Security review | @forger | API routes, webhooks, auth, GROQ filter verification |
| README + setup guide | @beacon | Clone → run in under 2 minutes |
| Architecture documentation | @beacon | System design, data flow diagrams |
| Content model documentation | @beacon + @eventide | Schema decisions, query patterns |
| Sanity feature showcase | @beacon | How each Sanity capability is used |
| Demo script | @beacon | Walkthrough for presentations |
| Production deployment | @forger | Vercel + Sanity production dataset |

**Deliverable:** Launched platform + comprehensive documentation.

---

## 4. Content Model Overview

> **Full spec:** Board artifact `content-model-spec` (checkpointed as `v2-sentinel-reviewed`)

### Core Document Types (10 — Sprint 1)
| Type | Purpose | Key References |
|------|---------|----------------|
| `conference` | Top-level container + CFP config | venue, tracks[] |
| `speaker` | Speaker profiles | — (referenced by sessions) |
| `session` | Unified type (D-002): keynote/talk/panel/workshop/lightning/break/social | speakers[], track, moderator |
| `scheduleSlot` | Time-slot assignments (when/where) | session, room, conference |
| `track` | Conference tracks with color | — |
| `venue` | Venue with rooms | — |
| `room` | Individual rooms within venue | venue |
| `sponsor` | Sponsor profiles with tier | — |
| `page` | Marketing pages with page builder (7 section types) | — |
| `announcement` | Blog/news posts | — |

### Additional Types (Sprint 2-6)
| Type | Purpose | Sprint |
|------|---------|--------|
| `submission` | CFP submissions with AI screening | 2 |
| `emailTemplate` | Email content as Portable Text | 3 |
| `bulkOperationLog` | AI/bulk operation tracking (P-005) | 4 |
| `attendee` | Registered attendees (from Luma webhooks) | 6 (deferred — Luma integration last) |
| `ticketType` | Ticket definitions (synced to Luma) | 6 (deferred — Luma integration last) |

### Object Types (Page Builder)
`hero`, `richText`, `speakerGrid`, `sponsorBar`, `schedulePreview`, `ctaBlock`, `faqSection`, `cta`. Shared: `seoFields` helper.

### Key Design Principles
- **Session/ScheduleSlot separation** — session = content (what/who), slot = logistics (when/where)
- **References over duplication** — speaker ↔ session is a `_ref`, not embedding
- **Conditional fields** — `hidden` callbacks on `sessionType` (panels get moderator, workshops get capacity)
- **Double-booking validation** — room+time collision detection, session uniqueness across slots
- **Triple-duty descriptions** — every field description serves editors, Content Agent, and developers
- **Image GROQ pattern** — `photo { ..., alt }` spread, no unnecessary `asset->` resolution
- **Stega-friendly** — ~80% of Visual Editing works automatically via CSM reference tracking

---

## 5. The Syndication Story — "Power Anything"

This project demonstrates a pattern that goes beyond a single conference: **Content Syndication from Sanity**.

The idea: Sanity Content Lake is the single source of truth. Content is authored once and syndicated to multiple platforms and surfaces:

| Destination | What's Synced | How |
|-------------|--------------|-----|
| **Conference Website** (Next.js) | Everything — schedule, speakers, sponsors, pages | GROQ queries + Live Content API |
| **Luma** | Events, ticket types, hosts, descriptions | Sanity Functions → Luma API |
| **Eventbrite** (future) | Same event data, different platform | Same pattern, different API |
| **Meetup** (future) | Workshop/side events | Same pattern |
| **Social Media** | Speaker announcements, schedule highlights | Agent Actions generate copy → manual or API post |
| **Email** (Resend) | Announcements, reminders, digests | Sanity Functions → Resend API |
| **AI Agents** (MCP) | Schedule, speakers, FAQ | Context for Agents |
| **Calendar feeds** | .ics exports | Next.js API route from Sanity data |

This is **"Power anything"** made real. One content operation, many outputs. And because it's all structured content with references (not blobs of text), each destination gets exactly the data it needs in the format it needs.

**For the demo narrative:** "We wrote the talk description once in Sanity. It appeared on the website, was synced to Luma for registration, generated a social media post via Content Agent, and powered the AI concierge's answer when an attendee asked 'What talks are about React?'"

---

## 6. Sanity Feature Showcase Map

Every major Sanity capability and where it appears:

| Capability | Where It's Used | Sprint |
|------------|----------------|--------|
| Content Lake | All event data — single source of truth | 1 |
| Studio (custom structure) | Organizer's command center | 1 |
| Content Modeling (schema-as-code) | 10+ document types with rich references, conditional fields | 1 |
| Validation Rules | Double-booking, session uniqueness, panel minimums, helpful messages | 1 |
| TypeGen | End-to-end type safety from schema to frontend | 0-1 |
| Visual Editing (stega) | Click-to-edit on all conference pages, CSM reference tracking | 2 |
| `use cache` + Sanity Live | Component-level caching, on-demand revalidation, zero stale windows | 0-2 |
| Portable Text | Speaker bios, session abstracts, CFP guidelines, emails | 1-4 |
| Media Library | Speaker photos, sponsor logos, venue images | 1-2 |
| References | Speaker↔Session, Session↔Track, Slot↔Room↔Venue (clean graph for resolver) | 1 |
| Functions (document events) | Email triggers, CFP AI screening, Luma sync, GROQ delta triggers | 3, 6 |
| Blueprints | Infrastructure-as-code for all Functions | 3 |
| Agent Actions (`prompt`) | CFP submission scoring against editorial criteria | 3 |
| Agent Actions (`generate`) | SEO metadata, talk summaries, social cards | 4 |
| Content Agent (Studio UI) | Bio enhancement, abstract improvement, editorial workflows | 4 |
| Content Agent Headless API | AI concierge on website via `useChat()` | 4 |
| GROQ Semantic Search | "Find talks about accessibility" | 4 |
| Content Releases | Speaker waves, schedule reveals, post-event archive flip | 5 |
| App SDK | Release Dependency Resolver tool, CFP Review Board (Phase 2) | 5, 7 |
| Canvas | Blog posts and announcements | 2 |
| Realtime Sync | Collaborative editing in Studio | 1 |
| Comments + Tasks | Editorial review workflows | 1 |

---

## 6. Open Items + Risks

### Remaining Open Items
- [ ] **P-004: Luma API key** — needed before Sprint 3
- [ ] **Conference branding** — design assets for ContentOps Conf (not blocking — minimal frontend first)
- [ ] **Domain** — what's the conference URL?

### Resolved Items
- [x] **Registration platform** → Luma (D-001)
- [x] **Session modeling** → Unified type with conditional fields (D-002)
- [x] **Frontend framework** → Next.js 16 + `use cache` (D-016)
- [x] **Visual Editing approach** → Stega by default, trust the platform (D-014)
- [x] **AI concierge path** → Content Agent Headless API primary, agent-context fallback (D-009)
- [x] **Design direction** → Minimal semantic scaffolding (D-010)
- [x] **Attendee auth** → Magic link via Resend, Phase 2 (D-007)
- [x] **Content Releases API** → Comprehensive, both Studio + programmatic viable (P-001)
- [x] **Preview API access** → Guaranteed, @knut works at Sanity (P-003)
- [x] **Multi-year routing** → Current year at root, past years at `/YYYY/`
- [x] **CFP timing** → MVP launch = landing page + CFP page

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| `next-sanity@cache-components` breaking changes | Frontend instability | Pinned version, `defineLive()` fallback documented + tested (D-016) |
| Scheduled Functions not available | Can't automate timed emails natively | Resend `scheduledAt` + Vercel Cron as fallback |
| Content Agent Headless API instability (preview) | Concierge unreliable | Thin abstraction wrapper, `@sanity/agent-context` fallback |
| AI Credits cost opacity | Developers copy pattern without cost awareness | Bulk Operation Log + guardrails as first-class features (P-005) |
| Content Releases don't auto-include refs | Broken references in production | Release Dependency Resolver tool (D-013, spec ready) |
| Content model changes mid-project | Migration pain | Model fully reviewed by team, checkpoint with @knut in Sprint 1 |
| CFP deadline rush (50+ submissions at once) | Function queue pressure | Idempotent Functions, status-based recursion protection |

---

## 7. Team Assignments Summary

| Agent | Primary Role | Sprints |
|-------|-------------|---------|
| @catalyst | Project management, coordination, brief | All |
| @forger | Frontend builder — Next.js 16, pages, Visual Editing, CFP form, archive routing, Resolver tool | 0, 1, 2, 3, 4, 5, 7-10 |
| @anvil | Integration builder — Functions, email pipeline, Luma sync, webhooks, Agent Actions (paired with @sentinel) | 0, 3, 4, 5, 6 |
| @eventide | Content model, schema implementation, seed data, deferred types | 1, 3, 5, 6 |
| @sentinel | Sanity platform (Studio, Functions, Agent Actions, Releases, AI) — specs patterns, @anvil implements | 0, 1, 3, 4, 5, 6 |
| @beacon | DX validation at 6 sprint gates (periodic, not continuous) | Gates at Sprint 0, 1, 2, 5, 5, end |
| @knut | Product direction, validation checkpoints, staging URL testing | All (continuous via staging URL + sprint checkpoints) |

**Package ownership:**
| Package | Owner | Consumers |
|---------|-------|-----------|
| `apps/web` | @forger | — |
| `apps/studio` | @sentinel + @forger | — |
| `packages/sanity-schema` | @eventide | @forger, @anvil, @sentinel |
| `packages/sanity-queries` | @forger | @anvil (reads) |
| `packages/email` | @anvil | — |
| `functions/` | @anvil | — |

---

## 8. Key Architecture Principles

1. **AI enhances, it doesn't enable (D-015)** — Platform works without AI. Show solid bones first, then show how AI makes it 10x better.
2. **Trust the platform** — Stega handles Visual Editing automatically. `sanityFetch` manages caching. Don't over-engineer.
3. **Ship tight, validate (D-004)** — Polished Phase 1 beats half-built Phase 1-10.
4. **Content model is a first-class deliverable (D-008)** — The kind of model people look at and say "oh, THAT'S how you do it right."
5. **Every pattern is an implicit recommendation** — This is a Sanity showcase. Cost guardrails, error handling, and DX are first-class features, not afterthoughts.

---

*Full decisions log: Board artifact `decisions` (16 decided, 3 resolved, 3 active pending)*
*Content model spec: Board artifact `content-model-spec` (v2-sentinel-reviewed)*
*Release Dependency Resolver spec: Board artifact `release-dependency-resolver-spec` (v1-team-reviewed)*
*Content Agent API docs: Board artifact `content-agent-api-docs`*
*Next.js 16 + use cache docs: Board artifact `sanity-live-use-cache-docs`*
