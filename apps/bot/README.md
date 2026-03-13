# Bot — Telegram Ops Bot

A Telegram bot for conference organizers. Uses Sanity Content Agent to answer questions about sessions, speakers, schedule, and submissions — and can make changes to content directly from Telegram.

## Stack

- **chat** — Multi-platform chat SDK
- **@chat-adapter/telegram** — Telegram adapter
- **content-agent** — Sanity Content Agent provider (AI SDK compatible)
- **ai** (Vercel AI SDK) — `generateText()` for AI responses
- **@sanity/client** — Content Lake read/write
- **Zod 3** — environment validation

## How It Works

1. An organizer messages the bot on Telegram
2. Bot checks if the sender's Telegram ID is in the conference's `organizers[]` list
3. If authorized, loads conversation history from the Content Lake (max 20 messages)
4. Fetches system prompt from `prompt.botOps` document (cached 60s)
5. Sends message + history to Content Agent via Vercel AI SDK
6. Content Agent can read/write Sanity documents (sessions, people, submissions, etc.)
7. Reply sent to Telegram thread
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

## Environment Variables

```bash
# Telegram
TELEGRAM_BOT_TOKEN=       # From @BotFather

# Sanity
SANITY_PROJECT_ID=yjorde43
SANITY_DATASET=production
SANITY_ORG_ID=            # Sanity organization ID (for Content Agent)
SANITY_API_TOKEN=         # General API token
SANITY_API_READ_TOKEN=    # Read-only token
SANITY_API_WRITE_TOKEN=   # Write token for mutations
```

Copy from the example:

```bash
cp .env.example .env
```

## Development

```bash
# From monorepo root
pnpm --filter @repo/bot dev

# Or from this directory
pnpm dev
```

Runs with `tsx watch` for auto-reload on changes.

### Setting Up a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. `/newbot` — follow prompts to create a bot
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Add your Telegram user ID to the conference document's `organizers[]` in Studio

## Key Files

```
src/
  index.ts                    → Entry point — Telegram adapter, event handlers
  handler.ts                  → Message processor — AI + reply + persist
  config.ts                   → Env var validation (Zod)

  ai/
    content-agent.ts          → Content Agent model initialization
    prompts.ts                → System prompt fetching from Content Lake

  security/
    allowlist.ts              → Organizer authorization check

  conversation/
    history.ts                → Load prior messages from Content Lake
    save.ts                   → Persist conversations to agent.conversation docs
```

## Build

```bash
pnpm build    # TypeScript → dist/
pnpm start    # Run compiled output
```
