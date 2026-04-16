/**
 * Observability hook.
 *
 * Next.js calls `register()` once per server process. This is the
 * extension point for OpenTelemetry, structured logging, error
 * tracking, RUM — whatever the deployer wants to plug in.
 *
 * This starter ships with a no-op so nothing leaks to third parties by
 * default. To wire up your own collector, replace the body of
 * `register()` — see `docs/observability.md` for examples.
 */

export async function register() {
  // No-op by default. See docs/observability.md for integration patterns.
}

export function onRequestError(
  err: unknown,
  request: {path: string; method: string; headers: Record<string, string>},
  context: {routerKind: string; routePath: string; routeType: string},
) {
  // Fallback error logger. Replace with Sentry / Datadog / OTel exporter
  // etc. Intentionally terse so it doesn't swallow the original error.
  console.error('[onRequestError]', request.method, request.path, err, context)
}
