# Contributing to ContentOps Conf Starter

Thanks for your interest in contributing! This is a reference architecture for running conferences on Sanity, so contributions that improve the patterns, fix bugs, or add useful integrations are welcome.

## Quick Start

```bash
# Fork and clone the repo
git clone https://github.com/<your-username>/conference-starter.git
cd conference-starter

# Install dependencies (pnpm only — see pnpm-workspace.yaml)
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/studio/.env.example apps/studio/.env.local

# Generate types from Sanity schema
pnpm typegen

# Start development
pnpm dev
```

You'll need a Sanity project ID and dataset. Create a free project at [sanity.io/manage](https://www.sanity.io/manage) or use the seed scripts to populate an existing one.

## Project Structure

| Directory | What goes here |
|-----------|---------------|
| `apps/web/` | Next.js 16 conference website |
| `apps/studio/` | Sanity Studio + Functions (Blueprints) |
| `apps/bot/` | Telegram ops/attendee bot |
| `packages/sanity-schema/` | Content model — all schema definitions |
| `packages/sanity-queries/` | GROQ queries — never scatter in page components |
| `packages/email/` | React Email templates + Resend integration |

## Key Patterns

- **GROQ queries** go in `packages/sanity-queries/`, not in page files
- **Schema types** go in `packages/sanity-schema/` and are shared across apps
- **Pages** follow the [three-layer `use cache` pattern](plans/sanity-live-use-cache-docs.md): sync page → dynamic layer → cached component
- **Architecture decisions** are documented in [plans/decisions.md](plans/decisions.md) — read this before proposing structural changes

## Submitting Changes

1. Open an [issue](../../issues/new/choose) first for non-trivial changes
2. Fork the repo and create a branch from `main`
3. Make your changes, following existing patterns
4. Ensure `pnpm type-check` and `pnpm build` pass
5. Use [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
6. Open a pull request

## Getting Help

- [Sanity Community Slack](https://slack.sanity.io) for general Sanity questions
- [Issue templates](../../issues/new/choose) for bugs, setup problems, and feature requests
- [plans/ directory](plans/) for architecture context and specifications
