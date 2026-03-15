# Feedback: Getting the Telegram Bot + Content Agent Running

**Date**: 2026-03-12
**Context**: Setting up `apps/bot/` — a Telegram ops bot using `chat` SDK, `content-agent`, and Sanity Content Lake for the first time on a local dev machine.

## Summary

Getting the bot from "code exists" to "responds to messages" took significantly longer than expected. Every step had a non-obvious failure mode, and most errors were silent or misleading. The individual pieces (chat SDK, content-agent, Sanity tokens) each have their own documentation, but nothing covers the end-to-end path of wiring them together.

---

## Issue 1: `chat` SDK — Silent startup, no polling without `initialize()`

**What happened**: Bot started, printed "bot started", but never received any Telegram messages. No errors, no logs, nothing.

**Root cause**: The `Chat` class requires `.initialize()` to start the Telegram polling loop. Without it, handlers are registered but the adapter never connects.

**Why it was confusing**:
- The README example doesn't call `.initialize()`. It shows `new Chat({...})` + handlers and nothing else.
- The JSDoc says "called automatically when handling webhooks" — but for polling (the default local dev mode), it's not automatic.
- There's no warning, no error, no log. The process just sits there silently.

**Suggestion for `chat` SDK docs**:
- Add `.initialize()` to the README example, or at minimum a note: "For polling mode, call `await bot.initialize()` after registering handlers."
- Consider auto-initializing when the first handler is registered and no webhook route is configured.
- Log a warning if handlers are registered but `initialize()` is never called within N seconds.

---

## Issue 2: `chat` SDK — `mode: 'auto'` doesn't reliably pick polling

**What happened**: Even after adding `initialize()`, had to explicitly set `mode: 'polling'` in the Telegram adapter config.

**Suggestion**: Document what `'auto'` actually checks for. If it checks `getWebhookInfo`, mention that a stale webhook from a previous deploy can prevent polling from activating.

---

## Issue 3: Content Agent — Token type is ambiguous

**What happened**: Three different tokens were tried before finding one that worked:
1. Short project robot token (`skznJR...`) → `SIO-401-ANF` "Session not found"
2. Organization "Manage SDK Apps" token (`g-7SL1utjO9LQY`) → `projectUserNotFoundError`
3. Project-level Editor token → worked

**Why it was confusing**:
- The `content-agent` README just says `token: 'your-sanity-token'` with no guidance on what kind of token.
- The Content Agent docs page says "create tokens in your project settings at sanity.io/manage" — but sanity.io/manage has tokens in two places: Organization → API → Tokens and Project → API → Tokens.
- The Organization token UI has a "Manage SDK Apps" permission that sounds like exactly what Content Agent needs. It's not.
- Error code `SIO-401-ANF` ("Session not found") gives no hint that the token type is wrong.

**Suggestion for `content-agent` docs**:
- Specify explicitly: "Create a **project-level** API token with **Editor** role from sanity.io/manage → Your Project → API → Tokens."
- Add a troubleshooting section for `SIO-401-ANF` — "This usually means you're using an organization token instead of a project token."
- The error message itself could be improved: "Session not found" → "Token not authorized for this project. Ensure you're using a project-level API token."

**Suggestion for sanity.io/manage**:
- The two token locations (org vs project) are a recurring source of confusion. Consider labeling them more clearly or adding a hint in the org token UI: "Organization tokens are for SDK Apps management. For API access to project content, create tokens in Project → API."

---

## Issue 4: Content Agent — Studio must be visited first

**What happened**: After fixing auth, got `NO_COMPATIBLE_APPLICATIONS` with message: "you must have at least one Sanity Studio running version 5.1.0 or above. After upgrading, open your studio to connect it to the agent."

**Why it was confusing**: This is a one-time setup step, but it's not mentioned in the `content-agent` npm package docs or the Content Agent API docs page. You only discover it at runtime.

**Suggestion**:
- Add to the Content Agent API "Prerequisites" section: "Open your Sanity Studio at least once after deploying the schema. This registers the Studio with the Content Agent service."
- The `content-agent` package could check for this condition and throw a more actionable error: "No registered Studio found. Open your Sanity Studio in a browser to complete setup."

---

## Issue 5: Environment variable sprawl

**What we changed**: Originally had 7 env vars for the bot, including 3 separate Sanity tokens (`SANITY_API_TOKEN`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`). Consolidated to 5 with a single `SANITY_API_TOKEN`.

**Lesson**: For a bot that uses both Content Agent and direct GROQ queries, a single Editor-role project token works for everything. The three-token pattern added complexity without security benefit — the bot needs write access regardless.

---

## Issue 6: `tsx watch` doesn't load `.env` files

**What happened**: Bot started but immediately crashed with "Missing environment variables" even though `.env` file existed with all values.

**Root cause**: Neither `tsx` nor `node` auto-load `.env` files. Added `--env-file=.env` flag to dev and start scripts.

**Note**: This is a Node.js thing, not a Sanity thing. But it's worth noting in any "getting started" guide that uses tsx for local dev.

---

## Suggested Documentation Improvements

### For `content-agent` npm package README
1. Specify token type: "project-level Editor token"
2. Add prerequisites: deployed schema + visited Studio
3. Add troubleshooting for `SIO-401-ANF` and `NO_COMPATIBLE_APPLICATIONS`

### For Content Agent API docs page
1. Prerequisites section should mention the Studio visit requirement
2. Authentication section should distinguish project tokens from org tokens
3. Add a "Common errors" section

### For `chat` SDK README
1. Show `initialize()` in the main example
2. Document polling vs webhook mode selection
3. Add a "Local development" section covering polling setup

### For sanity.io/manage
1. Clearer labeling of org tokens vs project tokens
2. Token creation flow could suggest the right type based on use case

---

## Issue 7: Deploying to Vercel (Webhook Mode)

**Date**: 2026-03-13
**Context**: Moving the bot from local polling to a Vercel serverless function with webhook delivery.

### 7a: `echo` adds trailing newlines to Vercel env vars

**What happened**: Bot crashed with `projectId can only contain a-z, 0-9 and dashes` — a baffling error since the value `yjorde43` is valid. After adding a debug endpoint, discovered the actual value was `"yjorde43\n"` (length 9).

**Root cause**: `echo "value" | vercel env add NAME production` pipes a string with a trailing newline. Vercel stores it verbatim.

**Fix**: Use `printf '%s' "value" | vercel env add ...` — `printf '%s'` does not add a trailing newline.

**Suggestion for Vercel CLI**: Strip trailing whitespace from piped env var values, or at minimum warn when a value contains newline characters.

### 7b: `extends` in tsconfig breaks in Vercel isolation

**What happened**: Build emitted `error TS5083: Cannot read file '/tsconfig.json'`. The bot's `tsconfig.json` had `"extends": "../../tsconfig.json"` — valid in the monorepo but invalid on Vercel where `apps/bot` is the filesystem root.

**Fix**: Made the bot's tsconfig self-contained (inlined all parent settings, removed `extends`). This also means it includes both `src/` and `api/` in the `include` array.

**Lesson**: Any monorepo package deployed to Vercel with a `rootDirectory` setting must have a self-contained tsconfig.

### 7c: `process.exit()` doesn't work reliably in serverless

**What happened**: The `config.ts` module called `process.exit(1)` on missing env vars, but in Vercel's serverless runtime, module evaluation continued past the exit call. The downstream `@sanity/client` then received `undefined` for `projectId`.

**Fix**: Replaced `process.exit(1)` with `throw new Error(...)`. Thrown errors properly halt module evaluation in all contexts.

**Lesson**: Never use `process.exit()` in code that runs in serverless functions. Always `throw`.

### 7d: Monorepo root vs subdirectory `.vercel` link

**What happened**: When `.vercel` was inside `apps/bot/` and the Vercel project had `rootDirectory: apps/bot`, deploy failed with path `apps/bot/apps/bot` (doubled).

**Fix**: Link from the monorepo root (`cd /repo && vercel link`). Vercel then applies `rootDirectory: apps/bot` correctly.

**Lesson**: The `.vercel` directory should live at the level Vercel uploads from. If `rootDirectory` is set on the project, link from the parent of that directory.

### 7e: `createMemoryState()` is per-invocation in serverless

**What happened**: The Chat SDK uses `createMemoryState()` for in-memory thread locks. In polling mode (single process), this works fine. In Vercel serverless, each invocation gets fresh memory. When two webhook calls arrive close together, the second invocation can't see the first's lock and gets `LockError: Could not acquire lock on thread`.

**Status**: **Resolved.** Replaced `createMemoryState()` with a custom Sanity-backed `StateAdapter` (`apps/bot/src/state/sanity-state-adapter.ts`). Uses `ifRevisionId` for optimistic concurrency on distributed locks, with `onLockConflict: 'force'` as a safety net. All Chat SDK state (subscriptions, locks, cache, lists) is persisted as `chat.state` documents in the Content Lake.

### 7f: Vercel team transfer changes domain scope

**What happened**: Project was created on `sanity-io` team (domain `*.sanity.build`), then transferred to `sanity-sandbox` team (domain `*.sanity.dev`). The alias still pointed to `sanity.build` but the deployment was on `sanity.dev`. Telegram couldn't resolve the `sanity.build` domain initially.

**Fix**: After transfer, the `sanity.build` alias continued working (Vercel keeps it). Webhook was registered with the working alias.

**Lesson**: After team transfers, verify domain aliases resolve correctly. Use `curl` to test before registering external webhooks.

### 7g: Turborepo env var warnings

**What happened**: Build showed warnings that `TELEGRAM_BOT_TOKEN`, `SANITY_API_TOKEN`, etc. are "set on your Vercel project but missing from turbo.json" and "WILL NOT be available to your application."

**Status**: Non-blocking — the env vars ARE available at runtime (they're only unavailable during the `turbo build` step, which just runs `tsc` and doesn't need them). But it's noisy and could confuse future maintainers.

**Status**: **Resolved.** Added all env vars (bot, web, email, Studio) to `turbo.json` under both `dev` and `build` tasks.

---

### Overall deployment lessons

1. **Test locally first.** Debugging Vercel deploys has a slow feedback loop (deploy → wait → check logs → redeploy). Use `ngrok` or a local webhook simulator to test the webhook handler before deploying.
2. **Debug endpoints are invaluable.** The temporary `/api/debug` endpoint that printed env var values immediately revealed the trailing newline issue. Add one early, remove before production.
3. **Serverless is a different runtime model.** Code that works in a long-running process (memory state, `process.exit`, module-level singletons) often breaks in serverless. Audit for these patterns before deploying.

---

## What Went Well

- Once the right token was in place and Studio was visited, Content Agent just worked — the bot responded with accurate answers about conference content.
- The `chat` SDK event model (onNewMention → subscribe → onSubscribedMessage) is clean and intuitive once you get past the initialization hurdle.
- Sanity's GROQ queries for the allowlist and conversation persistence worked without issues.
- The overall architecture (chat SDK + content-agent + Sanity Content Lake) is sound — the friction is entirely in setup/configuration, not in the runtime behavior.
