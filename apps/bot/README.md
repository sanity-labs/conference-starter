# Bot — Telegram Conference Bot

Two bots in one: an **ops bot** for organizers (read/write via Content Agent) and an **attendee bot** for the public (read-only via Agent Context + Anthropic Sonnet 4.6).

## First-Time Setup

> **How Telegram bots work**: Unlike Slack or Discord, Telegram bots are not shared instances you "join." Each developer creates their own bot via Telegram's [@BotFather](https://t.me/BotFather), gets a unique token, and runs the bot process locally. Users then find and message your bot by the username you chose during creation. Think of it like provisioning your own server, not joining someone else's.

### 1. Create your own Telegram bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather) (Telegram's official bot-creation tool)
2. Send `/newbot`
3. Choose a display name (e.g., "ContentOps Dev Bot")
4. Choose a username — must end in `bot` (e.g., `contentops_dev_bot`)
5. BotFather replies with a token like `123456:ABC-DEF...` — copy it, this is your `TELEGRAM_BOT_TOKEN`

You now have a bot. To talk to it, search for `@your_bot_username` in Telegram and start a chat. It won't respond yet — you need to run the bot process first (step 7 below).

Create a **separate** bot for local dev vs production — see [Dev vs Production](#dev-vs-production-use-separate-bots).

### 2. Set up Sanity credentials

1. **Create a Sanity API token**: [sanity.io/manage](https://sanity.io/manage) → Project → API → Tokens → Add Token → **Editor** role
2. **Find your org ID**: [sanity.io/manage](https://sanity.io/manage) → Organization → Settings → copy the ID
3. **Find your app key**: The Content Agent needs the deployed Studio's application key (see [Application Key](#application-key) below)

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in all values — see [Environment Variables](#environment-variables) for details on each.

### 4. Seed content and register yourself

1. **Seed the bot prompt**: `cd apps/studio && npx sanity exec ../../scripts/seed-prompts.ts --with-user-token`
2. **Open Studio once**: Visit your deployed Studio in a browser — this registers it with the Content Agent service
3. **Add yourself as organizer**: In Studio, edit the conference document → add your person to `organizers[]`
   - Your person document needs a `telegramId` field — this is your numeric Telegram user ID (not your username). To find it, message [@userinfobot](https://t.me/userinfobot) on Telegram.

### 5. Start the bot

```bash
pnpm dev
```

The preflight checks will tell you if anything is misconfigured.

### 6. Talk to your bot

Open Telegram, search for `@your_bot_username` (the name you chose in step 1), and send a message. If you're in the organizers list, you'll get an AI-powered response.

> **Tip**: While testing, use Telegram's "Clear Chat History" (tap the bot name → ⋮ menu → Clear History) to reset the conversation. This only clears your local Telegram view — the bot's conversation history in Sanity is separate.

## Architecture

```
┌──────────────┐         ┌───────────────────┐
│   Telegram   │◄───────►│  Chat SDK         │
│   (users)    │         │  ┌─────────────┐  │
└──────────────┘         │  │ Telegram     │  │
                         │              │ Adapter      │                   │
                         │  └─────────────┘  │
                         │  ┌─────────────┐  │
                         │              │ Sanity State │                   │
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
           │  │ Agent (AI)  │──┼──►  │  │ Sonnet 4.6    │ │
           │  └─────────────┘  │     │  └───────────────┘  │
           └───────────────────┘     │  ┌───────────────┐  │
                                     │                   │ Agent Context │                    │
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

Look for the entry matching your project's Studio (e.g., "ContentOps Conf" with resource `yjorde43.production`) and copy its `key` value.

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
