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

Scheduled functions (`daily-digest`, `reminder-cron`) exist as source but are commented out in `/sanity.blueprint.ts` — re-enable once the stack is org-scoped.

### Reminder idempotency

Scheduled functions run at-least-once: the platform can retry an invocation, and anyone can re-run one by hand. `reminder-cron` therefore never sends on date math alone. Each matching reminder is first **claimed** in a `reminderLog` document (`_shared/reminder-log.ts`):

- ID is deterministic: `reminderLog.{conferenceId}.{templateSlug}.{milestoneDate}`, where the milestone date is the date the reminder is about (CFP deadline, conference start, or conference end). Moving that date makes it a new reminder.
- `createIfNotExists` is the atomic claim. The function reads the document back and only proceeds if its own `runId` stuck; otherwise an earlier run owns it and this run skips.
- The claim is written **before** the email/Telegram sends, so a crash mid-send fails toward "not sent" rather than "sent twice". After sending, the document is patched to `status: "sent"` (or `"error"`) with per-channel `details`.
- A document stuck at `status: "claimed"` means a run died mid-send. Inspect it under **Reminder Logs** in Studio and delete it to let the next run send again.
- In dry-run (`context.local`) nothing is written, but an existing log still causes the reminder to be skipped so local output matches production behaviour.

## Shared utilities

`_shared/` contains helpers reused across functions:

- `email-render.ts` — `renderEmailBody()`, `wrapInLayout()`, `interpolateSubject()` for Portable Text → HTML without pulling React
- `email-layout.ts` — pre-generated layout HTML (regenerate with `pnpm --filter @repo/email generate-layout`)
- `reminder-log.ts` — `claimReminder()` / `recordReminderOutcome()` idempotency guard for scheduled sends (see above)

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
    reminder-log.ts                    → reminderLog claim/record helpers (idempotent scheduled sends)
  _fixtures/                           → Test fixtures for local function invocation
  <function-name>/
    index.ts                           → Entry point (documentEventHandler from @sanity/functions)
```
