# Bot — Telegram Conference Bot

Two bots in one: an **ops bot** for organizers (read/write via Content Agent) and an **attendee bot** for the public (read-only via Agent Context + Anthropic Sonnet 4.6).

## First-Time Setup

1. **Create a Telegram bot**: Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token (create a **separate** bot for local dev — see [Dev vs Production](#dev-vs-production-use-separate-bots))
2. **Create a Sanity API token**: [sanity.io/manage](https://sanity.io/manage) → Project → API → Tokens → Add Token → **Editor** role
3. **Find your org ID**: [sanity.io/manage](https://sanity.io/manage) → Organization → Settings → copy the ID
4. **Find your app key**: The Content Agent needs the deployed Studio's application key (see [Application Key](#application-key) below)
5. **Copy env file**: `cp .env.example .env` and fill in all values
6. **Seed the bot prompt**: `cd apps/studio && npx sanity exec ../../scripts/seed-prompts.ts --with-user-token`
7. **Open Studio once**: Visit your deployed Studio in a browser — this registers it with the Content Agent service
8. **Add yourself as organizer**: In Studio, edit the conference document → add your person (with your Telegram user ID) to `organizers[]`
9. **Start the bot**: `pnpm dev`

The preflight checks will tell you if anything is misconfigured.

## Architecture

```
┌──────────────┐         ┌───────────────────┐
│   Telegram   │◄───────►│  Chat SDK         │
│   (users)    │         │  ┌─────────────┐  │
└──────────────┘         │  │ Telegram     │  │
                         │  │ Adapter      │  │
                         │  └─────────────┘  │
                         │  ┌─────────────┐  │
                         │  │ Sanity State │  │
                         │  │ Adapter      │──┼──► Content Lake (locks, subscriptions)
                         │  └─────────────┘  │
                         └────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           ┌────────▼──────────┐     ┌──────────▼─────────┐
           │  Ops Handler      │     │  Attendee Handler   │
           │  (organizers)     │     │  (public)           │
           │  ┌─────────────┐  │     │  ┌───────────────┐  │
           │  │ Content     │  │     │  │ Anthropic     │  │
           │  │ Agent (AI)  │──┼──►  │  │ Sonnet 4.6   │  │
           │  └─────────────┘  │     │  └───────────────┘  │
           └───────────────────┘     │  ┌───────────────┐  │
                                     │  │ Agent Context │  │
                                     │  │ MCP (tools)  │──┼──► Sanity MCP
                                     │  └───────────────┘  │
                                     └─────────────────────┘
```

### Two AI Paths

| | Ops Bot (organizers) | Attendee Bot (public) |
|---|---|---|
| **LLM** | Content Agent (opaque) | Anthropic Sonnet 4.6 |
| **Content access** | Content Agent API | Agent Context MCP |
| **Permissions** | Read + Write | Read-only |
| **Config** | `SANITY_APP_KEY` + `SANITY_API_TOKEN` | `ANTHROPIC_API_KEY` + `SANITY_CONTEXT_MCP_URL` + `SANITY_API_READ_TOKEN` |

### Polling Mode (local dev)

The bot connects to Telegram's polling API in a long-running process. Preflight checks run on startup. Triggered when `VERCEL` env var is absent.

### Webhook Mode (production / Vercel)

Telegram pushes updates to `/api/webhooks/telegram`. Each invocation is a serverless function. The Sanity State Adapter persists locks and subscriptions to the Content Lake so state survives across cold starts.

## Stack

- **chat** — Multi-platform chat SDK
- **@chat-adapter/telegram** — Telegram adapter
- **content-agent** — Sanity Content Agent provider (ops bot)
- **@ai-sdk/anthropic** — Anthropic LLM provider (attendee bot)
- **@ai-sdk/mcp** — MCP client for Agent Context (attendee bot)
- **ai** (Vercel AI SDK) — `streamText()` for AI responses
- **@sanity/client** — Content Lake read/write + state adapter backend
- **Zod 3** — environment validation

## How It Works

1. An organizer messages the bot on Telegram
2. Bot checks if the sender's Telegram ID is in the conference's `organizers[]` list
3. If authorized, loads conversation history from the Content Lake (max 20 messages)
4. Fetches system prompt from `prompt.botOps` document (cached 60s)
5. Sends message + history to Content Agent via Vercel AI SDK
6. Content Agent can read/write Sanity documents (sessions, people, submissions, etc.)
7. Reply streamed to Telegram thread
8. Conversation persisted to `agent.conversation` document (async)

### Access Control

Only organizers listed in the `conference` document can interact with the bot. The allowlist is fetched from:

```groq
*[_type == "conference"][0].organizers[]->telegramId
```

Cached for 60 seconds.

### Content Agent Capabilities

| Permission | Document Types |
|-----------|---------------|
| **Read** | session, person, track, venue, room, scheduleSlot, submission, conference, announcement, sponsor, prompt |
| **Write** | submission, session, person, announcement, scheduleSlot |

### Application Key

The Content Agent API identifies your Studio workspace by an **application key**, not by project ID + dataset. This is because multiple Studios can share the same project/dataset — the key pins the agent to a specific deployed Studio and its schema.

The key format is `{studioAppId}-{workspaceName}` (e.g., `iqnz8eukp94bobzaorlf4m8x-default`). To find yours:

```bash
# Quick script to list available applications:
cd apps/bot && node --env-file=.env -e "
const {createContentAgent} = require('content-agent');
createContentAgent({
  organizationId: process.env.SANITY_ORG_ID,
  token: process.env.SANITY_API_TOKEN,
}).applications().then(apps => apps.forEach(a =>
  console.log(a.key, '→', a.title, '('+a.resource.id+')')
));
"
```

Look for the entry matching your project's Studio (e.g., "Everything NYC 2026" with resource `yjorde43.production`) and copy its `key` value.

**Common mistake**: Using the Studio app ID alone (e.g., `iqnz8eukp94bobzaorlf4m8x`) without the workspace suffix (`-default`). This produces `APPLICATION_NOT_FOUND`.

## Environment Variables

See `.env.example` for detailed comments on each variable.

```bash
cp .env.example .env
```

| Variable | Purpose | Where to find it |
|----------|---------|-------------------|
| `TELEGRAM_BOT_TOKEN` | Authenticate with Telegram | @BotFather → `/mytoken` |
| `SANITY_PROJECT_ID` | Target Sanity project | sanity.io/manage → Project |
| `SANITY_DATASET` | Target dataset | Usually `production` |
| `SANITY_ORG_ID` | Content Agent org scoping (ops bot) | sanity.io/manage → Organization → Settings |
| `SANITY_APP_KEY` | Content Agent Studio workspace (ops bot) | Run `contentAgent.applications()` (see [above](#application-key)) |
| `SANITY_API_TOKEN` | Auth for Content Agent + GROQ (Editor role) | sanity.io/manage → Project → API → Tokens |
| `ANTHROPIC_API_KEY` | Anthropic LLM for attendee bot | console.anthropic.com → API Keys |
| `SANITY_CONTEXT_MCP_URL` | Agent Context MCP endpoint (attendee bot) | Agent Context document in Studio |
| `SANITY_API_READ_TOKEN` | Read-only token for MCP auth (Viewer role) | sanity.io/manage → Project → API → Tokens |

## Development

```bash
# From monorepo root
pnpm --filter @repo/bot dev

# Or from this directory
pnpm dev
```

Runs with `tsx watch` for auto-reload on changes.

### Dev vs Production: Use Separate Bots

If you use the same Telegram bot for local dev and production, the production webhook and local polling will fight over updates — one of them stops receiving messages.

**Solution**: Create a second bot via `/newbot` in @BotFather. Use one for local dev (`TELEGRAM_BOT_TOKEN` in `.env`) and the other for production (Vercel env vars).

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Bot starts but never responds | Missing `initialize()` / stale webhook | Preflight checks should catch this. Ensure mode is explicit (`polling` locally). |
| `SIO-401-ANF` / "Session not found" | Using org token instead of project token | Create a **project-level** Editor token at sanity.io/manage → Project → API → Tokens |
| `APPLICATION_NOT_FOUND` | Wrong app key format | Key must be `{studioAppId}-{workspaceName}` (e.g., `abc123-default`), not just the app ID. Run `contentAgent.applications()` to find it. |
| `NO_COMPATIBLE_APPLICATIONS` | Studio not registered with Content Agent | Open your Sanity Studio in a browser at least once |
| `projectId can only contain a-z, 0-9 and dashes` | Trailing newline in env var | If you piped with `echo`, use `printf '%s' "value"` instead |
| `not a valid document ID` | Colons in Chat SDK keys | State adapter sanitizes IDs — if you see this, update the adapter. |
| `terminated by other getUpdates request` | Two bots polling same token | Use a **separate** dev bot token (see [above](#dev-vs-production-use-separate-bots)). Kill stale processes with `pkill -f tsx`. |
| `LockError: Could not acquire lock` | Stale locks from prior invocation | `onLockConflict: 'force'` handles this. If persistent, check Sanity state docs. |
| `Missing environment variables` on startup | `.env` not loaded | Ensure `--env-file=.env` is in the dev/start scripts |
| Bot responds to first message but drops concurrent ones | Memory state in serverless | Should be fixed by Sanity state adapter. Check `chat.state.lock.*` docs in Content Lake. |

## Key Files

```
src/
  index.ts                    → Entry point — preflight + initialize
  bot.ts                      → Chat SDK setup (adapter, state, handlers)
  handler.ts                  → Message processor — AI + reply + persist
  config.ts                   → Env var validation (Zod)
  sanity-client.ts            → Shared Sanity client instance
  preflight.ts                → Startup health checks (polling mode only)

  ai/
    content-agent.ts          → Content Agent model initialization (ops bot)
    agent-context.ts          → Agent Context MCP client factory (attendee bot)
    prompts.ts                → System prompt fetching from Content Lake

  security/
    allowlist.ts              → Organizer authorization check

  conversation/
    history.ts                → Load prior messages from Content Lake
    save.ts                   → Persist conversations to agent.conversation docs

  state/
    index.ts                  → Barrel export
    sanity-state-adapter.ts   → Chat SDK StateAdapter backed by Content Lake

api/webhooks/
  telegram.ts                 → Vercel serverless webhook handler
```

## Build

```bash
pnpm build    # TypeScript → dist/
pnpm start    # Run compiled output
```
