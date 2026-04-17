# Functions — Sanity Functions (Blueprints)

Event-driven serverless functions deployed to the Sanity platform via Blueprints. The blueprint manifest + function sources live together in this workspace; deploys run from here.

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

Scheduled functions (`daily-digest`, `reminder-cron`) exist as source but are commented out in `sanity.blueprint.ts` — re-enable once the stack is org-scoped.

## Shared utilities

`_shared/` contains helpers reused across functions:

- `email-render.ts` — `renderEmailBody()`, `wrapInLayout()`, `interpolateSubject()` for Portable Text → HTML without pulling React
- `email-layout.ts` — pre-generated layout HTML (regenerate with `pnpm --filter @repo/email generate-layout`)

**Why zero-React here**: functions run in Sanity's runtime, but even importing React Email components from `@repo/email` in Next.js API routes triggers a Turbopack React-dedup bug. To keep the rendering pipeline consistent end-to-end, functions use the `@portabletext/to-html` + pre-generated layout approach. See `packages/email/` for the React Email templates used for preview / dev only.

## Deploying

First time on a new environment:

```bash
pnpm dlx sanity@latest blueprints init
```

Creates `.sanity/blueprint.config.json` with the stack ID.

Subsequent deploys:

```bash
pnpm dlx sanity@latest blueprints deploy
```

If pnpm lockfile detection fails, add `--fn-installer pnpm`.

## Function environment variables

Set per-function:

```bash
pnpm dlx sanity@latest functions env add <function-name> RESEND_API_KEY re_...
pnpm dlx sanity@latest functions env add <function-name> SANITY_SCHEMA_ID _.schemas.default
```

Agent Actions require the Studio schema to be deployed:

```bash
cd ../studio && pnpx sanity@latest schema deploy
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
2. `pnpm dlx sanity@latest blueprints deploy` from this directory
3. Trigger by creating/updating the relevant document in Studio or via API
4. Tail logs: `pnpm dlx sanity@latest functions logs <function-name>`

## Key files

```
sanity.blueprint.ts      → Blueprint manifest (event bindings, resource refs, timeouts)
_shared/
  email-render.ts        → PT → HTML + layout wrapping + subject interpolation
  email-layout.ts        → Pre-generated layout HTML
_fixtures/               → Test fixtures for local function invocation
<function-name>/
  index.ts               → Entry point (documentEventHandler from @sanity/functions)
  package.json           → Function-scoped deps if any
```
