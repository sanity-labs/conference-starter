# Functions — Sanity Functions

Event-driven serverless functions deployed to the Sanity platform via Blueprints. **Function source lives here; the manifest lives at the repo root** (`/sanity.blueprint.ts`, next to `pnpm-lock.yaml`). This workspace owns the runtime deps; the manifest references each function via `src: './apps/functions/<name>'`.

## Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `screen-cfp` | `submission` created with `status == "submitted"` | AI scores + summarizes via Agent Actions |
| `rescreen-cfp` | `submission.status` → `"screening"` | Re-runs AI scoring after organizer resets |
| `send-cfp-confirmation` | Any `submission` created | Confirmation email via Resend |
| `send-status-email` | `submission.status` changes | Acceptance or rejection email |
| `send-announcement-email` | `announcement.status` → `"published"` | Fan-out to email subscribers via Resend |
| `push-announcement-telegram` | `announcement.status` → `"published"` | Posts to the Telegram channel |
| `classify-conversation` | `agent.conversation` created/updated | Auto-classifies (topic, sentiment) via Anthropic Haiku |
| `create-person-internal` | `person` draft created | Provisions paired `personInternal` record (travel, dietary, AV) |
| `delete-person-internal` | `person` deleted | Cleans up paired `personInternal` record |
| `daily-digest` | Cron — daily 07:00 America/New_York | Day-before preview + day-of schedule digest via Resend + Telegram |
| `reminder-cron` | Cron — daily 08:00 America/New_York | CFP-closing + event-reminder + post-event thank-you milestones |

Scheduled functions authenticate via the shared `scheduled-functions-robot` (viewer role) declared in `/sanity.blueprint.ts`. They require the blueprint stack to be organization-scoped — see [promote-stack docs](https://www.sanity.io/docs/blueprints/promote-stack-to-organization-scope).

## Shared utilities

`_shared/` contains helpers reused across functions:

- `email-render.ts` — `renderEmailBody()`, `wrapInLayout()`, `interpolateSubject()` for Portable Text → HTML without pulling React
- `email-layout.ts` — pre-generated layout HTML (regenerate with `pnpm --filter @repo/email generate-layout`)

**Why zero-React here**: functions run in Sanity's runtime, but even importing React Email components from `@repo/email` in Next.js API routes triggers a Turbopack React-dedup bug. To keep the rendering pipeline consistent end-to-end, functions use the `@portabletext/to-html` + pre-generated layout approach. See `packages/email/` for the React Email templates used for preview / dev only.

## Deploying

All blueprint commands run from the **repo root** (where `sanity.blueprint.ts` and `pnpm-lock.yaml` sit). Convenience scripts in root `package.json`:

```bash
pnpm blueprints:plan      # preview changes — always run this before deploy
pnpm blueprints:deploy    # apply changes to the stack
pnpm blueprints:info      # current stack status
pnpm blueprints:logs      # tail logs (--watch)
```

First time on a new environment, run from the repo root:

```bash
pnpm dlx sanity@latest blueprints init --project-id yjorde43 --stack-id ST-3ntyuc4apf --blueprint-type ts
```

This creates `.sanity/blueprint.config.json` at root pointing at the existing remote stack — no resource churn.

## Function environment variables

Set per-function (run from repo root):

```bash
pnpm dlx sanity@latest functions env add <function-name> RESEND_API_KEY re_...
pnpm dlx sanity@latest functions env add <function-name> SANITY_SCHEMA_ID _.schemas.default
```

Agent Actions require the Studio schema to be deployed:

```bash
pnpm --filter @repo/studio exec sanity schema deploy
```

## Event filters

Functions use GROQ-like delta filters. Common patterns in this repo:

```ts
// Run on status-change only
filter: '_type == "announcement" && delta::changedAny(status) && after().status == "published"'

// Run on create of drafts only
filter: '_type == "person" && _id match "drafts.*"', includeDrafts: true

// Run on any field change
filter: '_type == "agent.conversation" && (delta::changedAny(messages) || delta::operation() == "create") && defined(messages)'
```

## Local development

Functions don't run locally — they run in Sanity's runtime on real document events. For iterating:

1. Edit function source under `<name>/`
2. From repo root: `pnpm blueprints:deploy`
3. Trigger by creating/updating the relevant document in Studio or via API
4. Tail logs: `pnpm dlx sanity@latest functions logs <function-name>`

## Key files

```
/sanity.blueprint.ts                   → Blueprint manifest (at repo root, next to pnpm-lock.yaml)
/.sanity/blueprint.config.json         → Local stack binding (gitignored)
apps/functions/
  package.json                         → Workspace deps (Application Package in Turborepo terms)
  _shared/
    email-render.ts                    → PT → HTML + layout wrapping + subject interpolation
    email-layout.ts                    → Pre-generated layout HTML
  _fixtures/                           → Test fixtures for local function invocation
  <function-name>/
    index.ts                           → Entry point (documentEventHandler from @sanity/functions)
```
