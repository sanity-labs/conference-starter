# Telegram Ops Bot — Skill Reference

## Overview

A Telegram bot for conference organizers, built with the Chat SDK (`chat` npm package), Content Agent (`content-agent`), and Sanity Content Lake for persistent state. Deployed as a Vercel serverless function (webhook mode) with local polling for dev.

## Architecture

```
Telegram → Chat SDK (Telegram adapter) → Handler → Content Agent API → Sanity Content Lake
                       ↕
              Sanity State Adapter (locks, subscriptions, cache)
```

- **Polling mode** (local dev): Long-running `tsx watch` process, preflight checks on startup
- **Webhook mode** (Vercel): Stateless serverless function at `/api/webhooks/telegram`
- **State**: Persisted to Content Lake as `chat.state` documents (not in-memory)

## Key Files

| File | Purpose |
|------|---------|
| `apps/bot/src/bot.ts` | Chat SDK setup — adapter, state, event handlers |
| `apps/bot/src/index.ts` | Entry point — preflight + `bot.initialize()` |
| `apps/bot/src/handler.ts` | Message handler — AI streaming + conversation persistence |
| `apps/bot/src/config.ts` | Env var validation with Zod |
| `apps/bot/src/sanity-client.ts` | Shared `@sanity/client` instance |
| `apps/bot/src/preflight.ts` | Startup health checks (token validity, prompt doc, etc.) |
| `apps/bot/src/ai/content-agent.ts` | Content Agent model factory |
| `apps/bot/src/ai/prompts.ts` | System prompt fetched from `prompt.botOps` doc (60s cache) |
| `apps/bot/src/security/allowlist.ts` | Organizer Telegram ID allowlist (60s cache) |
| `apps/bot/src/conversation/history.ts` | Load conversation history from Content Lake |
| `apps/bot/src/conversation/save.ts` | Persist conversations to `agent.conversation` docs |
| `apps/bot/src/state/sanity-state-adapter.ts` | Chat SDK StateAdapter backed by Content Lake |
| `apps/bot/api/webhooks/telegram.ts` | Vercel serverless webhook endpoint |
| `packages/sanity-schema/src/documents/chatState.ts` | `chat.state` schema type |

## Critical Patterns

### Initialization

```typescript
// bot.ts — Chat SDK wiring
const telegram = createTelegramAdapter({
  botToken: config.telegramBotToken,
  mode: isServerless ? 'webhook' : 'polling',  // explicit, not 'auto'
})

const bot = new Chat({
  userName: 'everything-nyc-bot',
  adapters: {telegram},
  state: createSanityState(sanityClient),       // Content Lake, not memory
  onLockConflict: 'force',                      // safety net for stale locks
})
```

### Content Agent Token Types

The Content Agent API requires a **project-level Editor token** (not org token):
- **Correct**: sanity.io/manage → Project → API → Tokens → Editor role
- **Wrong**: Organization → API → Tokens (gives `SIO-401-ANF` error)
- **Wrong**: Short robot tokens like `skznJR...` (gives `SIO-401-ANF`)

The `content-agent` SDK takes `organizationId` + `token`:
```typescript
const contentAgent = createContentAgent({
  organizationId: config.sanityOrgId,  // org ID, not project ID
  token: config.sanityToken,           // project-level Editor token
})
```

### Application Key (SANITY_APP_KEY)

The Content Agent identifies a Studio workspace by an **application key**, NOT by `projectId.dataset`. This is because multiple Studios can share the same project/dataset.

- Key format: `{studioAppId}-{workspaceName}` (e.g., `iqnz8eukp94bobzaorlf4m8x-default`)
- The `studioAppId` is the deployed Studio's ID (visible in Sanity dashboard)
- The `-default` suffix is the workspace name from `sanity.config.ts`
- **Common mistake**: Using just the app ID without the workspace suffix → `APPLICATION_NOT_FOUND`
- **Common mistake**: Using `projectId.dataset` (e.g., `yjorde43.production`) → `APPLICATION_NOT_FOUND`
- Find the correct key: `contentAgent.applications()` lists all available Studios

### Sanity State Adapter

Replaces `@chat-adapter/state-memory` for serverless persistence. Uses path-based document IDs:
- `chat.state.sub.{threadId}` — subscriptions
- `chat.state.lock.{threadId}` — distributed locks (with `ifRevisionId` for atomic acquisition)
- `chat.state.cache.{key}` — key-value cache
- `chat.state.list.{key}` — ordered lists

Locks use optimistic concurrency control:
1. `createIfNotExists` for new locks (atomic)
2. Fetch + `patch` with `ifRevisionId` for expired lock takeover
3. Retry up to 3x with backoff on 409 conflict

### Telegram Adapter

```typescript
import {createTelegramAdapter} from '@chat-adapter/telegram'

// CORRECT — option is `botToken`, not `token`
createTelegramAdapter({botToken: '...'})
```

### Message Author

```typescript
// CORRECT
message.author.userId

// WRONG — no userId directly on message
message.userId
```

### Content Agent Capabilities

```typescript
// CORRECT — object with booleans
{capabilities: {read: true, write: true}}

// WRONG — not a string
{capabilities: 'standard'}
```

## Serverless Gotchas

| Gotcha | Detail |
|--------|--------|
| `process.exit()` | Does NOT halt module evaluation in serverless. Use `throw new Error()` instead. |
| `tsconfig extends` | `"extends": "../../tsconfig.json"` breaks when Vercel isolates the package. Make tsconfig self-contained. |
| `echo` piping env vars | `echo "value" \| vercel env add` adds a trailing newline. Use `printf '%s' "value" \| vercel env add`. |
| Memory state | `createMemoryState()` resets per invocation — use Sanity state adapter instead. |
| `mode: 'auto'` | A stale webhook registration can prevent auto-detection from picking polling. Set mode explicitly. |
| `.vercel` directory | Must be at monorepo root, not in the package subdirectory (avoids doubled paths). |

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `SIO-401-ANF` / "Session not found" | Wrong token type | Use project-level Editor token, not org token |
| `NO_COMPATIBLE_APPLICATIONS` | Studio not registered | Open Sanity Studio in browser at least once |
| `LockError: Could not acquire lock` | Stale locks from prior cold start | `onLockConflict: 'force'` handles this automatically |
| `projectId can only contain a-z, 0-9 and dashes` | Trailing newline in env var | Re-set env var with `printf '%s'` |
| Bot starts silently, no messages | Missing `initialize()` | Call `await bot.initialize()` after handler registration |

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot authentication |
| `SANITY_PROJECT_ID` | Yes | Target Sanity project |
| `SANITY_DATASET` | Yes | Target dataset (usually `production`) |
| `SANITY_ORG_ID` | Yes | Organization ID for Content Agent API |
| `SANITY_APP_KEY` | Yes | Studio application key (`{appId}-{workspace}`) |
| `SANITY_API_TOKEN` | Yes | Project-level Editor token |
| `VERCEL` | Auto | Set by Vercel — triggers webhook mode |

## Local Dev Workflow

1. Create a **separate** test bot via @BotFather (avoids webhook conflicts with production)
2. `cp .env.example .env` and fill in values
3. Ensure `prompt.botOps` doc exists: `cd apps/studio && npx sanity exec ../../scripts/seed-prompts.ts --with-user-token`
4. `pnpm --filter @repo/bot dev` — preflight checks validate everything before connecting
5. Message the bot on Telegram — it will only respond if your Telegram ID is in `conference.organizers[]`

## Dependencies

- `chat@^4.20.1` — Chat SDK core
- `@chat-adapter/telegram@^4.20.1` — Telegram platform adapter
- `content-agent@^0.4.5` — Sanity Content Agent AI SDK provider
- `ai@^6` — Vercel AI SDK (`streamText`)
- `@sanity/client@^7` — Content Lake client
- `@vercel/functions@^3` — `waitUntil` for webhook handler
- `zod@^3.23.8` — NOT v4 (content-agent peer dep requires v3)
