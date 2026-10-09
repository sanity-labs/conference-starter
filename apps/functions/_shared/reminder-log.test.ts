import {describe, it, expect, vi} from 'vitest'
import {
  claimReminder,
  recordReminderOutcome,
  reminderLogId,
  type ReminderLogClient,
  type ReminderLogDoc,
} from './reminder-log'

const KEY = {conferenceId: 'conf-2026', reminder: 'cfp-closing-soon', milestoneDate: '2026-08-15'}

/**
 * In-memory stand-in for the Content Lake: createIfNotExists only writes when
 * the ID is free, which is the property the claim relies on.
 */
function fakeClient(store = new Map<string, ReminderLogDoc>()) {
  const client = {
    createIfNotExists: vi.fn(async (doc: ReminderLogDoc) => {
      if (!store.has(doc._id)) store.set(doc._id, doc)
      return store.get(doc._id)
    }),
    getDocument: vi.fn(async (id: string) => store.get(id)),
    patch: vi.fn((id: string) => {
      const patches: Record<string, unknown>[] = []
      const builder = {
        set: (attrs: Record<string, unknown>) => {
          patches.push(attrs)
          return builder
        },
        commit: async () => {
          const current = store.get(id)
          if (!current) throw new Error(`no document ${id}`)
          store.set(id, Object.assign({}, current, ...patches))
          return store.get(id)
        },
      }
      return builder
    }),
  }
  return {client: client as unknown as ReminderLogClient, calls: client, store}
}

describe('reminderLogId', () => {
  it('is deterministic for the same key', () => {
    expect(reminderLogId(KEY)).toBe(reminderLogId({...KEY}))
  })

  it('encodes conference, reminder, and milestone date', () => {
    expect(reminderLogId(KEY)).toBe('reminderLog.conf-2026.cfp-closing-soon.2026-08-15')
  })

  it('differs when the milestone date moves', () => {
    expect(reminderLogId(KEY)).not.toBe(reminderLogId({...KEY, milestoneDate: '2026-08-16'}))
  })
})

describe('claimReminder', () => {
  it('first run wins the claim and the log is written as claimed', async () => {
    const {client, store} = fakeClient()

    const outcome = await claimReminder(client, KEY)

    expect(outcome.claimed).toBe(true)
    const stored = store.get(reminderLogId(KEY))
    expect(stored?.status).toBe('claimed')
    expect(stored?.reminder).toBe('cfp-closing-soon')
    expect(stored?.milestoneDate).toBe('2026-08-15')
    expect(stored?.conference).toEqual({_type: 'reference', _ref: 'conf-2026', _weak: true})
  })

  it('a retry of the same reminder does not get the claim', async () => {
    const {client, store} = fakeClient()

    const first = await claimReminder(client, KEY)
    const retry = await claimReminder(client, KEY)

    expect(first.claimed).toBe(true)
    expect(retry.claimed).toBe(false)
    // The retry sees the first run's record, not its own
    expect(retry.log?.runId).toBe(first.log?.runId)
    expect(store.size).toBe(1)
  })

  it('does not get the claim when the document was already sent by an earlier run', async () => {
    const {client} = fakeClient()
    const first = await claimReminder(client, KEY)
    if (!first.claimed) throw new Error('expected first claim to succeed')
    await recordReminderOutcome(client, first.log._id, {status: 'sent', details: 'email: sent'})

    const retry = await claimReminder(client, KEY)

    expect(retry.claimed).toBe(false)
    expect(retry.log?.status).toBe('sent')
  })

  it('a different milestone date is a separate reminder', async () => {
    const {client, store} = fakeClient()

    await claimReminder(client, KEY)
    const moved = await claimReminder(client, {...KEY, milestoneDate: '2026-08-16'})

    expect(moved.claimed).toBe(true)
    expect(store.size).toBe(2)
  })

  it('treats a failed read-back as not claimed', async () => {
    const {client, calls} = fakeClient()
    calls.getDocument.mockResolvedValueOnce(undefined)

    const outcome = await claimReminder(client, KEY)

    expect(outcome.claimed).toBe(false)
    expect(outcome.log).toBeNull()
  })
})

describe('recordReminderOutcome', () => {
  it('stamps sentAt only for a successful send', async () => {
    const {client, store} = fakeClient()
    const sentKey = KEY
    const failedKey = {...KEY, reminder: 'event-reminder-week'}
    const sent = await claimReminder(client, sentKey)
    const failed = await claimReminder(client, failedKey)
    if (!sent.claimed || !failed.claimed) throw new Error('expected both claims to succeed')

    await recordReminderOutcome(client, sent.log._id, {status: 'sent', details: 'email: sent'})
    await recordReminderOutcome(client, failed.log._id, {status: 'error', details: 'email: failed'})

    expect(store.get(reminderLogId(sentKey))?.status).toBe('sent')
    expect(store.get(reminderLogId(sentKey))?.sentAt).toBeDefined()
    expect(store.get(reminderLogId(failedKey))?.status).toBe('error')
    expect(store.get(reminderLogId(failedKey))?.sentAt).toBeUndefined()
  })
})
