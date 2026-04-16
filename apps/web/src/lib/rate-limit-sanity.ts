import type {SanityClient} from '@sanity/client'
import {createHash} from 'node:crypto'

/**
 * Sanity-backed rate limiter.
 *
 * Two layers:
 *   1. In-memory burst guard — cheap, instance-local, fails open if unavailable.
 *      Rejects > BURST_MAX requests within BURST_WINDOW_MS on the same instance.
 *   2. Sanity document counter — shared across all instances, survives restarts.
 *      Rejects > WINDOW_MAX requests within WINDOW_MS across the fleet.
 *
 * Document ID: `chat.state.ratelimit.{sha256(key).slice(0, 24)}` — hashing
 * keeps IPs out of document IDs while preserving determinism for retrieval.
 *
 * Optimistic concurrency via `ifRevisionId`; retries on 409 up to MAX_RETRIES.
 */

const BURST_WINDOW_MS = 10_000
const BURST_MAX = 10

const WINDOW_MS = 60 * 60_000 // 1 hour
const WINDOW_MAX = 100

const MAX_RETRIES = 3
const RETRY_DELAYS = [50, 100, 200]

interface RateLimitResult {
  allowed: boolean
  reason?: 'burst' | 'window'
  resetAt?: number
}

interface Doc {
  _id: string
  _rev: string
  _type: 'chat.state'
  kind: 'ratelimit'
  count: number
  expiresAt: number
}

const burstMap = new Map<string, {count: number; resetAt: number}>()

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 24)
}

function docId(key: string): string {
  return `chat.state.ratelimit.${hashKey(key)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isConflictError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return (err as {statusCode: number}).statusCode === 409
  }
  if (err instanceof Error) {
    return err.message.includes('Document was modified by another client')
  }
  return false
}

function checkBurst(key: string): RateLimitResult {
  const now = Date.now()
  const entry = burstMap.get(key)
  if (!entry || now > entry.resetAt) {
    burstMap.set(key, {count: 1, resetAt: now + BURST_WINDOW_MS})
    return {allowed: true}
  }
  entry.count++
  if (entry.count > BURST_MAX) {
    return {allowed: false, reason: 'burst', resetAt: entry.resetAt}
  }
  return {allowed: true}
}

async function checkWindow(
  client: SanityClient,
  key: string,
): Promise<RateLimitResult> {
  const id = docId(key)
  const now = Date.now()

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const existing = await client.fetch<Doc | null>(`*[_id == $id][0]`, {id})

      if (!existing || existing.expiresAt < now) {
        await client.createOrReplace({
          _id: id,
          _type: 'chat.state',
          kind: 'ratelimit',
          count: 1,
          expiresAt: now + WINDOW_MS,
        })
        return {allowed: true}
      }

      if (existing.count >= WINDOW_MAX) {
        return {allowed: false, reason: 'window', resetAt: existing.expiresAt}
      }

      await client.patch(id).ifRevisionId(existing._rev).inc({count: 1}).commit()
      return {allowed: true}
    } catch (err) {
      if (!isConflictError(err) || attempt === MAX_RETRIES) {
        console.error('rate-limit-sanity: giving up after error', err)
        return {allowed: true}
      }
      await sleep(RETRY_DELAYS[attempt] ?? 200)
    }
  }

  return {allowed: true}
}

export async function checkRateLimit(
  client: SanityClient,
  key: string,
): Promise<RateLimitResult> {
  const burst = checkBurst(key)
  if (!burst.allowed) return burst
  return checkWindow(client, key)
}
