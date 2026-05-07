export type DemoOptions = {
  /** Pinned wall-clock ISO timestamp; null means "use real Date.now()". */
  demoNowISO: string | null
  /** Override for display.lookaheadMinutes; null means "use the configured value". */
  demoLookaheadMinutes: number | null
}

export const NO_DEMO: DemoOptions = {demoNowISO: null, demoLookaheadMinutes: null}

export function parseDemoOptions(input: {at?: string; lookahead?: string}): DemoOptions {
  let demoNowISO: string | null = null
  if (input.at) {
    const parsed = new Date(input.at)
    if (!Number.isNaN(parsed.getTime())) demoNowISO = parsed.toISOString()
  }
  let demoLookaheadMinutes: number | null = null
  if (input.lookahead) {
    const parsed = Number(input.lookahead)
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 1440) {
      demoLookaheadMinutes = Math.floor(parsed)
    }
  }
  return {demoNowISO, demoLookaheadMinutes}
}

export function isDemoActive(demo: DemoOptions): boolean {
  return demo.demoNowISO !== null || demo.demoLookaheadMinutes !== null
}
