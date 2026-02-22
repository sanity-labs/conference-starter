# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Everything NYC 2026 — a conference operations platform built on Sanity as a reference architecture. Not just a CMS-backed website, but a **content operating system** for events: the Content Lake drives the website, emails, registration (Luma), AI concierge, and automation.

This repo is currently in **pre-Sprint 0** — planning docs exist in `plans/`, no application code yet.

## Planned Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 16 (App Router, `use cache`) |
| CMS | Sanity Studio + App SDK custom apps |
| Sanity integration | `next-sanity@cache-components` (canary) |
| Email | Resend + React Email + Portable Text |
| Registration | Luma (syndication pattern — Sanity → Luma, Luma webhooks → Sanity) |
| AI | Content Agent Headless API (preview), Agent Actions, `@sanity/agent-context` fallback |
| Automation | Sanity Functions (Blueprints) |
| Types | `sanity typegen` — end-to-end type safety from schema to frontend |

## Planned Monorepo Structure

```
apps/web/                        # Next.js conference website
apps/studio/                     # Sanity Studio
apps/studio/functions/           # Sanity Functions (Blueprints)
apps/studio/sanity.blueprint.ts  # Blueprint manifest
packages/sanity-schema/          # Content model + TypeScript types
packages/sanity-queries/         # GROQ queries (colocated, not scattered in pages)
packages/email/                  # React Email templates + Resend integration
```

## Key Architecture Patterns

### Three-Layer `use cache` Component Pattern
Every page follows: (1) sync page with `<Suspense>`, (2) dynamic layer calling `getDynamicFetchOptions()` outside cache boundary, (3) cached component with `'use cache'` receiving `perspective` and `stega` as cache keys. See `plans/sanity-live-use-cache-docs.md` for full docs.

### Editable AI Prompts
AI instruction prompts (used by Sanity Functions) are stored as `prompt` documents in the Content Lake with path-based IDs (e.g., `prompt.cfpScreening`). This lets organizers tweak prompts in Studio without code changes. Key details:
- `liveEdit: true` — edits take effect immediately, no draft/publish workflow
- Functions fetch via `*[_id == "prompt.cfpScreening"][0].instruction`
- Prompts use `$variable` placeholders that map to `instructionParams` in Agent Actions
- Studio structure: "AI Prompts" section with singleton entries per prompt
- Seed: `cd apps/studio && npx sanity exec ../../scripts/seed-prompts.ts --with-user-token`

### Content Model (10 core types)
- **session** — unified type (keynote/talk/panel/workshop/lightning/break/social) with conditional fields via `hidden` callbacks on `sessionType`. NOT separate document types per format.
- **scheduleSlot** — join document (when/where). Session = content (what/who), slot = logistics.
- **conference** — top-level container, also holds CFP config (`cfpOpen`, `cfpDeadline`, `cfpGuidelines`, `scoringCriteria`)
- Full spec: `plans/content-model-spec.md`

### Content Model Principles
- References over duplication (speaker ↔ session is a `_ref`, never embedded)
- Triple-duty field descriptions: serve editors, Content Agent, and developers
- Validation with empathy: "End time must be after start time" not "Invalid value"
- Image GROQ pattern: `photo { ..., alt }` spread, no unnecessary `asset->` resolution
- Stega-friendly: ~80% of Visual Editing works automatically via CSM reference tracking

### Visual Editing
Stega by default. Use `createDataAttribute` only for non-text elements (images, dates, wrapper elements). CSM tracks through reference chains (`->`) automatically.

### Metadata
Always use `perspective: 'published'` and `stega: false` for `generateMetadata`.

### AI Concierge
Content Agent Headless API proxied through Next.js API route. GROQ filter as server-side data boundary (not prompt-level). Locked to `published` perspective. `useChat()` from Vercel AI SDK on frontend.

## Planning Documents

All specs live in `plans/`:
- `brief.md` — full project brief with architecture, sprints, team assignments
- `masterplan.md` — vision, content model overview, feature roadmap
- `content-model-spec.md` — complete schema spec with GROQ query patterns
- `decisions.md` — 22 architecture decisions with rationale (D-001 through D-022)
- `sanity-live-use-cache-docs.md` — three-layer cache component pattern
- `content-agent-headless-api.md` — AI concierge integration reference

## Key Decisions to Remember

- **D-001**: Luma for registration — Sanity syndicates TO Luma, Luma webhooks sync BACK
- **D-002**: Unified `session` type with conditional fields, not separate types
- **D-005**: Turborepo monorepo with pnpm
- **D-010**: Minimal frontend design — semantic HTML scaffolding, designers handle visual design later
- **D-014**: Visual Editing on everything, stega by default
- **D-015**: AI enhances, doesn't enable — platform works without AI features
- **D-016**: Next.js 16 + `use cache` with guardrails (pinned canary, `defineLive()` fallback, version check)
- **D-020**: Luma integration last (Sprint 6) — internal systems proven first
- **D-021**: TypeGen in CI + targeted integration tests + Vercel preview deploys — no blanket UI testing

## Sprint Sequence

0. Project setup (Turborepo, Next.js 16, `createPage` helper)
1. Content model + Studio (10 document types, custom structure, TypeGen, seed data)
2. Core website + CFP page (MVP launch: landing + CFP form)
3. Email pipeline + CFP AI screening (Resend, Functions Blueprints)
4. AI features + Content Agent (concierge, Agent Actions, semantic search)
5. Content Releases + archive (year-based routing, dependency resolver)
6. Luma integration (Sanity → Luma sync, webhook handler, attendee records)

## Browser Debugging

For non-Next.js apps (Sanity Studio, standalone apps), use the `agent-browser` CLI for visual debugging:

```bash
agent-browser --headed open http://localhost:3333       # Open Studio in visible browser
agent-browser screenshot                                 # Take screenshot of current page
agent-browser snapshot                                   # Get accessibility tree (for finding elements)
agent-browser click @e2                                  # Click element by ref from snapshot
agent-browser eval "document.querySelector('...')"       # Run JS in page
```

The `--headed` flag opens a visible browser window (not headless), useful when authentication is required. The `next-devtools` MCP handles Next.js apps — use `agent-browser` for everything else.

## Conventions

- TypeScript everywhere
- GROQ queries in `packages/sanity-queries`, never scattered in page components
- Schema in `packages/sanity-schema`, consumed by web app and functions
- Conventional commits (commitlint)
- **`pnpm` is the package manager** — always use `pnpm` (not npm/yarn) for install, add, run, exec. Use `pnpx` instead of `npx` for one-off commands (e.g., `pnpx sanity@latest ...`)
