# Architecture Decisions Log

## Decided

### D-001: Luma for Registration & Ticketing
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** Use Luma for registration/ticketing. Sanity syndicates event content TO Luma via API. Luma webhooks sync registration data BACK to Sanity.
**Rationale:** Luma handles payments, refunds, waitlists, check-in. Sanity stays the single source of truth for content. Creates a "Power anything" syndication showcase.

### D-002: Unified Session Type
**Date:** 2026-02-20 | **Decided by:** @forger + @sentinel (endorsed by team)
**Decision:** Single `session` document type with `sessionType` field (keynote, talk, panel, workshop, lightning, break, social) and conditional fields. No separate document types.
**Rationale:** One GROQ query for all sessions, simpler Content Releases, schedule slots reference one type, filtering is trivial. Panels get a moderator field, workshops get capacity/prerequisites/materials.

### D-003: Resend + Portable Text for Email
**Date:** 2026-02-20 | **Decided by:** @knut + @forger
**Decision:** Email templates as Portable Text in Sanity, rendered with `@portabletext/react` using custom email-safe components (tables, inline styles). Sent via Resend.
**Rationale:** Same library, different component map. No separate serializer needed. Editors author emails in Studio like any other content.

### D-004: Ship Tight, Validate
**Date:** 2026-02-20 | **Decided by:** Team consensus
**Decision:** Ship Sprints 0-6 as a polished core (content model + website + Luma integration + email + Content Releases + AI features). Validate with real users before committing to Phase 2 (App SDK custom apps, personal schedule, etc.).
**Rationale:** A polished Phase 1 beats a half-built Phase 1-10. The reference architecture story is strongest as "here's what we built and learned" not "here's everything we imagined."

### D-015: AI Enhances, It Doesn't Enable
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** The conference platform must work perfectly without any AI features. AI is a force multiplier layered on top of solid bones, not a load-bearing wall. Every AI feature has a manual fallback.
**Examples:**
- Content Agent helps editors draft faster → editors can write everything manually
- Agent Actions generate social snippets and SEO metadata → editors can do that too
- AI concierge helps attendees find sessions → the schedule page works fine without it
**Rationale:** This is both good product design (graceful degradation) and a stronger demo narrative. Show the solid platform first, then show how AI makes it 10x better. Sprint structure reflects this: Sprints 1-5 build the platform, Sprint 6 layers on AI.

### D-005: Turborepo Monorepo
**Date:** 2026-02-20 | **Decided by:** @forger (endorsed by @sentinel)
**Decision:** Turborepo monorepo with `/apps/web`, `/apps/studio`, `/packages/sanity-schema`, `/packages/sanity-queries`, `/packages/email`, `/functions`.
**Rationale:** Schema changes propagate instantly. TypeGen runs against shared packages. One PR, one CI run. `pnpm dev` starts everything.

### D-006: TypeGen Everywhere
**Date:** 2026-02-20 | **Decided by:** @forger + @sentinel
**Decision:** `sanity typegen` generates TypeScript types from both schemas AND GROQ queries. Non-negotiable for a reference architecture.
**Rationale:** End-to-end type safety from schema to frontend. GROQ queries co-located in shared package, not scattered across page components.

### D-007: Magic Link Auth (for Phase 2 attendee features)
**Date:** 2026-02-20 | **Decided by:** @forger (changed mind after @beacon's UX argument)
**Decision:** If/when we build personal schedule features, use magic link via Resend — not Luma confirmation codes.
**Rationale:** Less friction for users (click a link vs. find and enter a code). Implementation cost is manageable: Resend sends link, verify signed token, httpOnly cookie.

### D-008: Content Model as First-Class Deliverable
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** The content model is a showcase of Sanity best practices: rich references, custom validation with helpful messages, field descriptions that serve triple duty (Content Agent + developer docs + editor guidance).
**Rationale:** This should be the kind of content model people look at and say "oh, THAT'S how you do it right."

### D-009: AI Concierge — Content Agent API (Primary) + agent-context (Fallback)
**Date:** 2026-02-20 | **Decided by:** @knut (direction), team (architecture)
**Decision:** Build the AI concierge using Content Agent Headless API (preview) as primary path, with `@sanity/agent-context` as fallback. Wrap in a thin abstraction layer (~20 lines) so implementation is swappable.
**Architecture:**
1. Abstraction wrapper around Content Agent API
2. Next.js proxy route with rate limiting (20 msg/min per session) + logging to Bulk Operation Log
3. `useChat()` (Vercel AI SDK) on the frontend — start with one-shot `/prompt` endpoint (stateless, no thread management). Add threaded conversations in Phase 2 if users want conversational context.
4. GROQ filter: `_type in ["session", "speaker", "track", "venue", "sponsor"]` — server-side data boundary, not prompt-level
5. Locked to `published` perspective — concierge never sees drafts. Content Releases become the "knowledge update" mechanism.
6. `@sanity/agent-context` as fallback if preview API proves unstable
**Sprint 6 acceptance criteria (from @beacon):** Verify GROQ filter security, reference chain traversal, time-to-first-token latency.
**Rationale:** Content Agent API is purpose-built for Q&A over content. ~half day implementation. Remarkable effort-to-demo-value ratio.

### D-010: Minimal Frontend Design — Semantic Scaffolding
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** Frontend focuses on semantic HTML markup and clean component scaffolding. No heavy design — human designers will handle visual design later.
**Rationale:** Better reference architecture (developers don't have to rip out opinionated design). Good bones for designers to skin. Unblocks frontend work from design dependency.
**Approach:** Semantic HTML, proper heading hierarchy, accessible landmarks, Tailwind utilities for basic layout, clean component structure, Visual Editing wired up.

### D-014: Visual Editing on Everything
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** Every page that renders Sanity content must support Visual Editing via Presentation Tool. No exceptions.
**Implementation:** Stega by default — CSM tracks through reference chains (`->`), so text content from referenced documents is automatically clickable with zero manual work. Use `createDataAttribute` only for non-text elements (images, dates, wrapper elements, drag-and-drop). Don't obsess on coverage upfront — build with stega, take a pass afterward to cover gaps.
**Rationale:** Visual Editing is one of Sanity's strongest differentiators. Trust the platform — stega handles ~80% automatically. Engineer less.

### D-011: Content Agent vs. Agent Actions — Two (Soon Three) Integration Points
**Date:** 2026-02-20 | **Identified by:** @beacon, updated by @knut
**Decision:** Three AI integration layers:
1. **Content Agent (Studio UI)** — editorial tool for organizers, conversational interface
2. **Agent Actions (SDK API)** — programmatic API for Functions/automation (`@sanity/client`)
3. **Content Agent Headless API (coming soon)** — programmatic access to Content Agent's conversational capabilities, outside of Studio

**Impact:** The headless API could power the AI concierge directly and enable automated content ops from Functions using Content Agent's conversational model (not just raw Agent Actions). This may change the Sprint 6 architecture significantly.
**Status:** Awaiting access to internal docs (private repo). @knut to share.

### D-012: defineLive() + `use cache` for Cache Revalidation (UPDATED)
**Date:** 2026-02-20 | **Decided by:** @knut (final call), architecture by @forger + @sentinel
**Decision:** Use `next-sanity@cache-components` (experimental) with Next.js 16's `use cache` directive. This is the next evolution of `defineLive()` — same Live Content API revalidation, but with granular component-level caching via `'use cache'` boundaries.
**Architecture:** Three-layer component pattern: (1) sync page with `<Suspense>`, (2) dynamic layer resolving `perspective`/`stega` outside cache, (3) cached component with `'use cache'` receiving perspective as cache key. `sanityFetch` auto-manages `cacheTag()` and `cacheLife()`.
**Hard dependency:** Next.js 16+ with `cacheComponents: true`. Install `next-sanity@cache-components`.
**Rationale:** @knut's call — "move to where the puck is headed." Sanity has a test release ready for feedback. This project provides real production feedback on the canary. Blazing fast performance with separate cache entries for published vs. draft content.
**Docs:** Board artifact `sanity-live-use-cache-docs`. Source: `sanity-io/next-sanity` branch `cache-components`.
**Risk:** Experimental canary — breaking changes possible. Mitigated by @knut's direct access to the next-sanity team.

### D-016: Next.js 16 + `use cache` with Guardrails
**Date:** 2026-02-20 | **Decided by:** @knut (direction), @forger (guardrails), @beacon (DX fallback)
**Decision:** Ship on Next.js 16 + `next-sanity@cache-components` from Sprint 0, with four guardrails:
1. **`createPage` helper** — scaffolds the three-layer pattern (sync → dynamic → cached), eliminates boilerplate
2. **Pinned canary version** — lockfile pins exact version, upgrades are deliberate
3. **Vanilla `defineLive()` fallback** — documented, tested, ready to downgrade if canary breaks for >1 day
4. **Next.js 16 version check** — `pnpm dev` fails fast with clear error if wrong version detected
**DX story:** Reference architecture documents BOTH paths — `use cache` as primary (bleeding edge), vanilla `defineLive()` as stable alternative for teams not ready for Next.js 16. This serves both audiences.
**Dissent noted:** @beacon and @forger initially recommended starting with stable `defineLive()` and upgrading later. @knut overrode based on strategic context (Sanity internal, test release needs production feedback, "move to where the puck is headed"). Guardrails address the team's risk concerns.
**Sprint 0 tasks:** `createPage` helper (~2h), version check script (~1h), fallback documentation (~1h).

### D-017: Call for Papers (CFP) — Submission Form + AI Pre-Screening
**Date:** 2026-02-20 | **Decided by:** @knut (feature request), team (architecture)
**Decision:** Build a public CFP submission form that creates `submission` documents in Sanity. AI pre-screens submissions against editorial criteria via Sanity Function + Agent Actions `prompt`.
**Architecture:**
- Public form → Next.js API route → `client.create({ _type: 'submission' })` with scoped write token
- Sanity Function triggers on create (`status == 'submitted'`) → Agent Actions `prompt` scores against `cfpCriteria` → writes `aiScreening` object
- Studio "Re-screen" document action as manual escape hatch (same `prompt` call, different trigger)
- Acceptance: Studio document action creates `session` + `speaker` from submission (one-way transform)
- Status flow: `submitted` → `screening` → `scored` → `in-review` → `accepted`/`rejected`/`withdrawn`
- `cfpCriteria` lives on `conference` document in a "CFP" field group
**Security:** Rate limiting (IP + honeypot), zod validation, scoped write token, no direct Content Lake access from browser.
**Sprint:** CFP page in Sprint 2 (MVP launch), AI screening in Sprint 4.
**Rationale:** Perfect "AI enhances, doesn't enable" showcase. Editors can review without AI, but AI pre-screening saves hours on 100+ submissions.

### D-018: Post-Conference Archive + Year-Based Routing
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** Current conference year at root domain (`everything.nyc/`), past years at `/YYYY/` paths. Post-conference, content becomes an archive with recordings.
**Implementation:**
- `conference.status`: `upcoming` → `live` → `archived`
- `session.recording`: video URL field populated post-conference
- Frontend renders differently based on conference status (schedule → video library)
- Content Releases showcase: flip conference from "live" to "archived" atomically
**Sprint:** Archive routing + recording field in Sprint 6.

### D-019: MVP Launch = Landing Page + CFP
**Date:** 2026-02-20 | **Decided by:** @knut
**Decision:** The site can launch with just a landing page and CFP submission page. Full conference pages build out from there.
**Impact:** CFP moves to Sprint 2 (not Sprint 9). Sprint ordering adjusted accordingly.

### D-020: Sprint Reorder — Luma Integration Last
**Date:** 2026-02-20 | **Decided by:** @knut (direction), team (unanimous)
**Decision:** Reorder sprints to push Luma integration to Sprint 6 (last). New order: Sprint 2 (core website + CFP), Sprint 3 (email + CFP AI screening), Sprint 4 (AI features + concierge), Sprint 5 (Content Releases + archive), Sprint 6 (Luma integration).
**Rationale:** Luma is the gnarliest external dependency — hardest to test, most unknowns. By Sprint 6, Functions infrastructure is proven over 3 sprints, Agent Actions validated, content model battle-tested. Luma sync becomes "just another Function with a different API client." Also allows deferring `attendee` and `ticketType` schemas until they're actually needed.
**Impact:** @anvil starts with internal systems (email, Functions), tackles external API last. @eventide defers Luma-dependent schemas to Sprint 6.

### D-021: Testing & Validation Strategy
**Date:** 2026-02-20 | **Decided by:** @forger (proposal), @beacon (DX scope), @knut (feedback loop)
**Decision:** Four-layer testing strategy: (1) TypeGen in CI catches schema↔query drift at build time, (2) targeted integration tests on data boundaries (API routes, Functions, email rendering), (3) Vercel preview deploys give @knut a continuous staging URL, (4) formal sprint checkpoints with @knut hands-on + @beacon DX gate review.
**What we don't do:** Blanket UI testing, continuous QA click-throughs, test coverage mandates.
**@beacon's role:** 6 periodic DX gates (not continuous testing). Evaluates "should a reference architecture recommend this pattern?" — not "does this button work?"
**Rationale:** TypeGen + targeted tests + staging URL + human review is the right balance. @beacon is wasted on click-through testing — keep them at gates where the question is pattern quality.

### D-022: Two-Builder Split — @forger (Frontend) + @anvil (Integration)
**Date:** 2026-02-20 | **Decided by:** @catalyst (proposal), @knut (approved)
**Decision:** Split build work between two builders with clean package boundaries. @forger owns `apps/web` + `packages/sanity-queries` (frontend, pages, Visual Editing, CFP form, archive routing). @anvil owns `packages/email` + `functions/` (Sanity Functions, Luma sync, email pipeline, webhooks, Agent Actions). @anvil paired with @sentinel for Sanity platform patterns.
**Rationale:** @forger's load was unsustainable across all sprints. Clean package boundaries prevent merge conflicts. Enables parallelization (Sprint 3 email + Sprint 3 CFP form simultaneously). @sentinel specs patterns, @anvil implements — tight feedback loop.

### D-013: Release Dependency Resolver Tool
**Date:** 2026-02-20 | **Decided by:** @sentinel + @beacon + @forger
**Decision:** Build an App SDK / Studio tool that auto-walks `_ref` fields when adding documents to a Content Release, showing a diff view (green=included, red=missing, yellow=still draft) and allowing one-click inclusion of dependencies. Block release publishing when dangling draft references are detected.
**Rationale:** Conference content model is deeply reference-heavy. Manual dependency tracking will fail. Tooling prevents broken references in production. Also a great reusable open-source contribution.

## Pending

### ~~P-001: Content Releases — Studio-first or Programmatic?~~ → RESOLVED
**Status:** Both viable from day one. @sentinel's research for the Release Dependency Resolver spec confirmed the programmatic API is comprehensive: `releases::all()`, `sanity::partOfRelease()`, `sanity.action.document.version.create`, `@sanity/id-utils` helpers. Full CRUD on releases, version document management, scheduling, and rich GROQ functions. Studio-first for editorial workflows, programmatic for the Dependency Resolver tool and automation.

### ~~P-002: Design Direction~~ → RESOLVED (see D-010)
**Status:** Resolved — minimal design, semantic scaffolding. Human designers handle visual design later.

### ~~P-003: @sanity/agent-context Access~~ → RESOLVED
**Status:** Confirmed — @knut works at Sanity. Access to agent-context, Content Agent API, and all preview features is guaranteed.

### P-004: Luma API Key
**Status:** Needed before Sprint 3
**Context:** Required for integration development and testing.

### P-005: AI Credits Cost Guardrails → MUST-SHIP
**Status:** First-class feature of the reference architecture (upgraded per @beacon)
**Context:** Cost isn't a concern for *us* (Sanity internal), but @beacon correctly argues: this is a Sanity showcase, so every pattern we ship is an implicit recommendation. A reference architecture that demos bulk AI without cost visibility tells developers "just run it and hope for the best." That's bad DX advocacy from the platform itself.
**What ships:** Bulk Operation Log (who ran what, when, estimated cost), confirmation UI for bulk AI ops, rate limiting on concierge proxy, cost benchmarking documentation. Built as first-class features, not afterthoughts.
**Principle:** "Build as if we're paying for every credit, showcase as a best practice."

### P-006: Headless Content Agent API — Evaluation
**Status:** Docs available — evaluating against criteria
**Context:** @knut shared internal docs (private repo `sanity-io/sanity-agent`). @catalyst pulled full README + OpenAPI spec via GitHub CLI. Docs on board at `content-agent-api-docs`.

**@beacon's gate criteria — answered from actual docs:**
1. **GA or preview?** → **Preview** (`vX` API version). Not GA. Caution warranted.
2. **Relationship to Agent Actions?** → **Separate paradigm.** Agent Actions = imperative (generate/transform/translate fields). Content Agent API = conversational (ask questions, get answers, with configurable read/write capabilities + GROQ filters). Not a layer on top — different mental model.
3. **AI Credits cost model?** → **Not addressed in docs.** Same opacity problem. Programmatic access at scale makes this worse, not better.
4. **Auth model?** → **Standard Sanity Bearer token.** For attendee-facing chatbot: proxy through Next.js API route (don't expose token to client). Clean pattern.

**Additional findings from docs:**
- TypeScript SDK (`content-agent` package) with Vercel AI SDK provider
- Thread-based conversations (server-side message persistence) + one-shot prompts
- GROQ filters for document access control (restrict to conference content types)
- Perspective locking (read from published only, write to drafts only)
- Custom instructions per thread/prompt
- SSE streaming compatible with `useChat()` from `@ai-sdk/react`

**Assessment:** Very promising for the concierge. Almost a drop-in solution with `useChat()`. But preview status means we plan with `@sanity/agent-context` as fallback. **Recommend: Content Agent API as primary concierge path in Sprint 6, with fallback to agent-context if preview proves unstable.**

**Current plan:** D-011's model stands. Re-evaluate stability when we reach Sprint 6.
