import type {SanityClient} from '@sanity/client'
import type {StateAdapter, Lock} from 'chat'

/**
 * Chat SDK StateAdapter backed by the Sanity Content Lake.
 *
 * Each piece of state is a document with a path-based ID:
 *   chat.state.sub.{threadId}   — subscription
 *   chat.state.lock.{threadId}  — distributed lock
 *   chat.state.cache.{key}      — key-value cache
 *   chat.state.list.{key}       — ordered list
 *
 * Distributed locking uses Sanity's `ifRevisionId` for optimistic
 * concurrency control — no external lock service needed.
 */

const MAX_RETRIES = 3
const RETRY_DELAYS = [50, 100, 200]

import {sanitizeDocumentId as sanitize} from '../utils/sanitize.js'

function subId(threadId: string): string {
  return `chat.state.sub.${sanitize(threadId)}`
}

function lockId(threadId: string): string {
  return `chat.state.lock.${sanitize(threadId)}`
}

function cacheId(key: string): string {
  return `chat.state.cache.${sanitize(key)}`
}

function listId(key: string): string {
  return `chat.state.list.${sanitize(key)}`
}

function randomToken(): string {
  return crypto.randomUUID()
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

interface StateDoc {
  _id: string
  _rev: string
  _type: string
  kind: string
  threadId?: string
  lockToken?: string
  expiresAt?: number
  value?: string
  items?: string[]
}

export function createSanityState(client: SanityClient): StateAdapter {
  // ── Subscriptions ──────────────────────────────────────────

  async function subscribe(threadId: string): Promise<void> {
    await client.createOrReplace({
      _id: subId(threadId),
      _type: 'chat.state',
      kind: 'subscription',
      threadId,
    })
  }

  async function unsubscribe(threadId: string): Promise<void> {
    await client.delete(subId(threadId))
  }

  async function isSubscribed(threadId: string): Promise<boolean> {
    const doc = await client.getDocument(subId(threadId))
    return !!doc
  }

  // ── Distributed Locks ──────────────────────────────────────

  async function acquireLock(threadId: string, ttlMs: number): Promise<Lock | null> {
    const id = lockId(threadId)
    const token = randomToken()
    const expiresAt = Date.now() + ttlMs

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Try to create — only succeeds if doc doesn't exist
      try {
        await client.createIfNotExists({
          _id: id,
          _type: 'chat.state',
          kind: 'lock',
          threadId,
          lockToken: token,
          expiresAt,
        })

        // Verify we won the race by reading back
        const doc = await client.getDocument<StateDoc>(id)
        if (doc?.lockToken === token) {
          return {threadId, token, expiresAt}
        }

        // Someone else created it first — check if expired
        if (doc && doc.expiresAt !== undefined && doc.expiresAt < Date.now()) {
          // Expired lock — try to take over with ifRevisionId
          try {
            await client
              .patch(id)
              .ifRevisionId(doc._rev)
              .set({lockToken: token, expiresAt})
              .commit()
            return {threadId, token, expiresAt}
          } catch (err) {
            if (isConflictError(err)) {
              // Another invocation beat us — retry
              if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAYS[attempt])
                continue
              }
              return null
            }
            throw err
          }
        }

        // Lock exists and is not expired — can't acquire
        return null
      } catch (err) {
        // createIfNotExists doesn't throw on conflict, but handle edge cases
        if (isConflictError(err) && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
        throw err
      }
    }

    return null
  }

  async function releaseLock(lock: Lock): Promise<void> {
    const id = lockId(lock.threadId)
    const doc = await client.getDocument<StateDoc>(id)
    if (!doc || doc.lockToken !== lock.token) return // no-op on mismatch

    try {
      await client.delete(id)
    } catch {
      // Best-effort — if it fails, lock will expire via TTL
    }
  }

  async function extendLock(lock: Lock, ttlMs: number): Promise<boolean> {
    const id = lockId(lock.threadId)
    const doc = await client.getDocument<StateDoc>(id)
    if (!doc || doc.lockToken !== lock.token) return false

    const newExpiresAt = Date.now() + ttlMs
    try {
      await client.patch(id).ifRevisionId(doc._rev).set({expiresAt: newExpiresAt}).commit()
      lock.expiresAt = newExpiresAt
      return true
    } catch (err) {
      if (isConflictError(err)) return false
      throw err
    }
  }

  async function forceReleaseLock(threadId: string): Promise<void> {
    await client.delete(lockId(threadId))
  }

  // ── Key-Value Cache ────────────────────────────────────────

  async function get<T = unknown>(key: string): Promise<T | null> {
    const doc = await client.getDocument<StateDoc>(cacheId(key))
    if (!doc || !doc.value) return null
    // Check TTL
    if (doc.expiresAt !== undefined && doc.expiresAt < Date.now()) {
      // Lazily clean up expired entries
      client.delete(cacheId(key)).catch(() => {})
      return null
    }
    return JSON.parse(doc.value) as T
  }

  async function set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    await client.createOrReplace({
      _id: cacheId(key),
      _type: 'chat.state',
      kind: 'cache',
      value: JSON.stringify(value),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    })
  }

  async function del(key: string): Promise<void> {
    await client.delete(cacheId(key))
  }

  async function setIfNotExists(key: string, value: unknown, ttlMs?: number): Promise<boolean> {
    const id = cacheId(key)
    await client.createIfNotExists({
      _id: id,
      _type: 'chat.state',
      kind: 'cache',
      value: JSON.stringify(value),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    })
    // Read back to check if our value was the one that stuck
    const doc = await client.getDocument<StateDoc>(id)
    if (!doc || !doc.value) return false
    return doc.value === JSON.stringify(value)
  }

  // ── Lists ──────────────────────────────────────────────────

  async function appendToList(
    key: string,
    value: unknown,
    options?: {maxLength?: number; ttlMs?: number},
  ): Promise<void> {
    const id = listId(key)
    const serialized = JSON.stringify(value)

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const doc = await client.getDocument<StateDoc>(id)

      if (!doc) {
        // Create new list
        try {
          await client.createIfNotExists({
            _id: id,
            _type: 'chat.state',
            kind: 'list',
            items: [serialized],
            expiresAt: options?.ttlMs ? Date.now() + options.ttlMs : undefined,
          })
          return
        } catch (err) {
          if (isConflictError(err) && attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAYS[attempt])
            continue
          }
          throw err
        }
      }

      // Append to existing list
      let items = [...(doc.items ?? []), serialized]
      if (options?.maxLength && items.length > options.maxLength) {
        items = items.slice(-options.maxLength)
      }

      try {
        await client
          .patch(id)
          .ifRevisionId(doc._rev)
          .set({
            items,
            expiresAt: options?.ttlMs ? Date.now() + options.ttlMs : undefined,
          })
          .commit()
        return
      } catch (err) {
        if (isConflictError(err) && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
        throw err
      }
    }
  }

  async function getList<T = unknown>(key: string): Promise<T[]> {
    const doc = await client.getDocument<StateDoc>(listId(key))
    if (!doc || !doc.items) return []
    // Check TTL
    if (doc.expiresAt !== undefined && doc.expiresAt < Date.now()) {
      client.delete(listId(key)).catch(() => {})
      return []
    }
    return doc.items.map((item) => JSON.parse(item) as T)
  }

  // ── Adapter ────────────────────────────────────────────────

  return {
    connect: async () => {},
    disconnect: async () => {},
    subscribe,
    unsubscribe,
    isSubscribed,
    acquireLock,
    releaseLock,
    extendLock,
    forceReleaseLock,
    get,
    set,
    delete: del,
    setIfNotExists,
    appendToList,
    getList,
  }
}
