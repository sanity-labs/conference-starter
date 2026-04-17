# Studio — Sanity Studio

Sanity Studio for ContentOps Conf. Includes custom structure, a drag-and-drop schedule builder, CFP submission workflow actions, and Sanity Functions for automation.

## Stack

- **Sanity Studio v5.11** — content editing
- **Sanity Functions** (Blueprints) — event-driven automation
- **@sanity/sdk-react** — App SDK for custom tools
- **@dnd-kit** — drag-and-drop for schedule builder
- **Resend** — email delivery from functions

## Plugins

| Plugin | Purpose |
|--------|---------|
| `structureTool` | Custom sidebar navigation with grouped content types |
| `visionTool` | GROQ query playground |
| `colorInput` | Color picker for track colors |
| `presentationTool` | Visual Editing with Next.js preview |
| `agentContextPlugin` | `@sanity/agent-context` — registers the MCP endpoint used by the attendee bot + web concierge |
| `scheduleBuilder` | Custom tool — drag-and-drop schedule management |

## Studio Structure

The sidebar is organized for conference operations:

- **Conference** — Singleton with event metadata, CFP config, branding
- **People** — All speakers/organizers + filters by travel status
- **Sessions** — All + grouped by type (keynote, talk, panel, workshop, etc.)
- **Schedule** — Slots by day with assignment UI
- **Tracks** — Color-coded session categories
- **Submissions** — CFP submissions filtered by status (submitted, screening, scored, accepted, rejected)
- **Announcements** — News items
- **Email** — Templates + delivery audit log
- **AI Prompts** — Editable instructions for AI features (live-edit singletons)
- **Conversations** — Telegram bot message history

## Custom Document Actions

Document-specific actions wired up in `sanity.config.ts`:

| Action | Schema type | What it does |
|--------|------------|-------------|
| **Accept Submission** | `submission` | Creates a `person` doc from submitter, creates a `session` doc, creates a `scheduleSlot`, sends acceptance email |
| **Reject Submission** | `submission` | Sends rejection email, updates status |
| **Re-screen Submission** | `submission` | Resets status to "screening" to trigger AI re-evaluation |
| **Send Test Email** | `emailTemplate` | POSTs the rendered template to `/api/send-test-email` on the web app (sends to the current user's email) |
| **Send Update** | `announcement` | Publishes the document — downstream Functions fan it out to email + Telegram |

## Schedule Builder

A custom Studio tool for managing the conference schedule:

- Day picker to navigate between conference days
- Visual grid showing time slots and room assignments
- Drag-and-drop session assignment
- Conflict detection (room double-booking, speaker overlaps, moderator conflicts)
- Assignment dialog for creating/editing schedule slots

Key files:
```
tools/schedule-builder/
  index.tsx               → Tool plugin registration
  ScheduleGrid.tsx        → Main grid component
  DayPicker.tsx           → Date navigation
  AssignmentDialog.tsx    → Slot editing dialog
  ConflictBadge.tsx       → Conflict warning display
  utils/
    conflicts.ts          → Overlap detection logic
    timeGrid.ts           → Time slot calculations
```

## Document Preview Panes

| Pane | Schema types | What it shows |
|------|-------------|---------------|
| Email Preview | `emailTemplate` | Rendered email HTML via `/api/email-preview` |
| Social Preview | `session`, `person`, `conference`, `page` | Live OG image from `/api/og` with title/description character counts |

## Sanity Functions (Blueprints)

Nine document event handlers defined in `apps/functions/sanity.blueprint.ts`:

| Function | Trigger | Action |
|----------|---------|--------|
| `screen-cfp` | Submission created (status: submitted) | AI scores with Agent Actions, writes score + feedback |
| `send-cfp-confirmation` | Any submission created | Sends confirmation email via Resend |
| `send-status-email` | Submission status changes | Sends appropriate email (accepted/rejected/screened) |
| `rescreen-cfp` | Status changed back to "screening" | Re-runs AI scoring |
| `send-announcement-email` | Announcement status → "published" | Distributes announcement via Resend |
| `push-announcement-telegram` | Announcement status → "published" | Posts announcement to Telegram channel |
| `classify-conversation` | Bot conversation created/updated | Classifies conversation topic via AI |
| `create-person-internal` | Person draft created | Provisions the paired `personInternal` record (travel, dietary, AV) |
| `delete-person-internal` | Person deleted | Cleans up the paired `personInternal` record |

Scheduled functions (`daily-digest`, `reminder-cron`) are commented out in the blueprint — re-enable once the stack is org-scoped.

### Deploying Functions

```bash
# From apps/functions/
pnpm dlx sanity@latest blueprints deploy
```

First time only: run `pnpm dlx sanity@latest blueprints init` from `apps/functions/` to generate `.sanity/blueprint.config.json` with the stack ID.

### Setting Function Environment Variables

```bash
pnpx sanity@latest functions env add <function-name> RESEND_API_KEY sk-re-...
pnpx sanity@latest functions env add <function-name> SANITY_SCHEMA_ID _.schemas.default
```

### Deploying Schema

Functions using Agent Actions require the schema to be deployed:

```bash
pnpx sanity@latest schema deploy
```

## Environment Variables

```bash
# Required
SANITY_STUDIO_PROJECT_ID=yjorde43
SANITY_STUDIO_DATASET=production

# Optional
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000   # Base URL for presentation + email preview
SANITY_STUDIO_SEND_SECRET=                         # Sent as x-studio-secret to /api/send-test-email; must match STUDIO_SEND_SECRET on the web app
```

Copy from the example:

```bash
cp .env.example .env.local
```

Function-level env vars (Resend API key, schema ID) are set separately via the CLI — see "Setting Function Environment Variables" above.

## Development

```bash
# From monorepo root
pnpm --filter @repo/studio dev

# Or from this directory
pnpm dev
```

Runs on [http://localhost:3333](http://localhost:3333).

## Seed Data

Seed scripts live in the repository root `scripts/` directory:

```bash
# From apps/studio/
npx sanity exec ../../scripts/seed-prompts.ts --with-user-token
```

Note: must use project-local `npx sanity exec` (not `pnpx`) for token injection to work.

## Key Files

```
sanity.config.ts          → Studio configuration (plugins, schema, document actions)
structure.ts              → Custom sidebar structure
resolve.ts                → Presentation tool URL resolver

actions/
  acceptSubmission.ts     → Accept CFP → create person + session
  rejectSubmission.ts     → Reject CFP → send email
  rescreenSubmission.ts   → Re-screen CFP → trigger AI re-evaluation
  sendTestEmail.ts        → Email template → POST to /api/send-test-email (with shared secret)
  sendUpdate.ts           → Announcement → publish (Functions distribute it downstream)

tools/
  schedule-builder/       → Drag-and-drop schedule management

components/
  EmailPreview.tsx        → Email template preview in Studio
  OgPreview.tsx           → Social share (OG image) preview in Studio
```

Sanity Functions live in a sibling workspace at `apps/functions/` (blueprint + function sources), not here.
