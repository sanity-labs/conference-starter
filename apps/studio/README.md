# Studio — Sanity Studio

Sanity Studio for Everything NYC 2026. Includes custom structure, a drag-and-drop schedule builder, CFP submission workflow actions, and Sanity Functions for automation.

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

Submission workflow actions (only appear on `submission` documents):

| Action | What it does |
|--------|-------------|
| **Accept Submission** | Creates a `person` doc from submitter, creates a `session` doc, creates a `scheduleSlot`, sends acceptance email |
| **Reject Submission** | Sends rejection email, updates status |
| **Re-screen Submission** | Resets status to "screening" to trigger AI re-evaluation |

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

## Sanity Functions (Blueprints)

Five document event handlers defined in `sanity.blueprint.ts`:

| Function | Trigger | Action |
|----------|---------|--------|
| `screen-cfp` | Submission created (status: submitted) | AI scores with Agent Actions, writes score + feedback |
| `send-cfp-confirmation` | Any submission created | Sends confirmation email via Resend |
| `send-status-email` | Submission status changes | Sends appropriate email (accepted/rejected/screened) |
| `rescreen-cfp` | Status changed back to "screening" | Re-runs AI scoring |
| `classify-conversation` | Bot conversation created/updated | Classifies conversation topic via AI |

### Deploying Functions

```bash
# From apps/studio/
pnpx sanity@latest blueprints deploy
```

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
sanity.blueprint.ts       → Sanity Functions manifest (5 event handlers)
structure.ts              → Custom sidebar structure
resolve.ts                → Presentation tool URL resolver

actions/
  acceptSubmission.ts     → Accept CFP → create person + session
  rejectSubmission.ts     → Reject CFP → send email
  rescreenSubmission.ts   → Re-screen CFP → trigger AI re-evaluation

functions/
  screen-cfp/             → AI screening with Agent Actions
  send-cfp-confirmation/  → Confirmation email on submission
  send-status-email/      → Status change emails
  rescreen-cfp/           → Re-screening handler
  classify-conversation/  → Bot conversation classification

tools/
  schedule-builder/       → Drag-and-drop schedule management

components/
  EmailPreview.tsx        → Email template preview in Studio
```
