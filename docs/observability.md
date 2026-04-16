# Observability

The starter ships without a built-in observability vendor. Deploy it to Vercel, Netlify, Fly, a bare VPS, whatever — and wire the observability stack you already run.

The extension point is `apps/web/src/instrumentation.ts`. Next.js calls its `register()` once per server process; `onRequestError()` fires whenever a route handler throws. Both are no-ops in the repo so the starter stays platform-agnostic.

## Common patterns

### OpenTelemetry (vendor-neutral)

```ts
// apps/web/src/instrumentation.ts
import {registerOTel} from '@vercel/otel'

export async function register() {
  registerOTel({serviceName: 'contentops-conf-web'})
}
```

Works with any OTel-compatible backend (Honeycomb, Grafana Cloud, New Relic, self-hosted Jaeger). `@vercel/otel` is a convenience — swap for `@opentelemetry/sdk-node` if you'd rather not pull a Vercel-branded package.

### Sentry

```ts
// apps/web/src/instrumentation.ts
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1})
  }
}

export function onRequestError(err: unknown, request, context) {
  Sentry.captureRequestError(err, request, context)
}
```

### Structured console logs (no vendor)

```ts
export function onRequestError(err, request, context) {
  console.error(JSON.stringify({
    level: 'error',
    ts: Date.now(),
    path: request.path,
    method: request.method,
    route: context.routePath,
    error: err instanceof Error ? {message: err.message, stack: err.stack} : err,
  }))
}
```

Anything that tails stdout will pick them up (Vercel runtime logs, Datadog log collector, Papertrail, Loki, etc.).

## What to instrument first

If you only have time for a few panels, start with:

1. **`/api/chat` latency and error rate.** The concierge is the noisiest endpoint and depends on MCP + Anthropic + Sanity.
2. **Rate-limit 429s** (see `apps/web/src/lib/rate-limit-sanity.ts`). Spikes signal abuse or a misconfigured client.
3. **Sanity Function failures** — different surface; follow Sanity Blueprints logs via `sanity functions logs`, not Next.js instrumentation.
4. **CFP submission funnel** — conversions, validation rejects, screening latency.

## Platform notes

- **Vercel deployers**: add `@vercel/analytics` and `@vercel/speed-insights` to `app/layout.tsx` if you want first-party RUM. Keeping them out of the default starter is intentional — pick them up per-fork.
- **Self-hosted**: use OpenTelemetry with your existing collector. `register()` is the only call site needed.
