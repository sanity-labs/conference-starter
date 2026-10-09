/**
 * Idempotency guard for scheduled reminders.
 *
 * Scheduled functions run at-least-once: the platform may retry an invocation
 * and an operator may re-run one by hand. Without a record of what already
 * went out, every retry re-sends the matching reminder to the whole audience.
 *
 * Each (conference, reminder, milestone date) gets one `reminderLog` document
 * with a deterministic ID. `createIfNotExists` is the atomic claim: the first
 * invocation to create the document owns the send, and every other invocation
 * reads back a document carrying someone else's `runId` and skips. The claim
 * is written *before* anything is sent, so a crash mid-send fails toward
 * "sent once or not at all" rather than "sent twice". Mirrors the lock pattern
 * in `apps/bot/src/state/sanity-state-adapter.ts`.
 */

import type {SanityClient} from '@sanity/client'

export type ReminderLogStatus = 'claimed' | 'sent' | 'error'

export interface ReminderLogDoc {
  _id: string
  _type: 'reminderLog'
  conference: {_type: 'reference'; _ref: string; _weak: true}
  reminder: string
  milestoneDate: string
  runId: string
  status: ReminderLogStatus
  claimedAt: string
  sentAt?: string
  details?: string
}

export interface ReminderKey {
  conferenceId: string
  /** Email template slug of the reminder, e.g. `cfp-closing-soon`. */
  reminder: string
  /** The date the reminder is about (CFP deadline, conference start/end), as YYYY-MM-DD. */
  milestoneDate: string
}

export type ClaimOutcome =
  | {claimed: true; log: ReminderLogDoc}
  | {claimed: false; log: ReminderLogDoc | null}

export type ReminderLogClient = Pick<SanityClient, 'createIfNotExists' | 'getDocument' | 'patch'>

/**
 * Deterministic document ID for a reminder, so a retry of the same run lands
 * on the same document. Path-based like the other operational docs
 * (`chat.state.*`, `prompt.*`), which also keeps it auth-only on public datasets.
 */
export function reminderLogId({conferenceId, reminder, milestoneDate}: ReminderKey): string {
  return `reminderLog.${conferenceId}.${reminder}.${milestoneDate}`
}

/**
 * Claim a reminder before sending it. Returns `claimed: true` only when this
 * invocation created the log document; if an earlier run already claimed the
 * same key the existing document is returned so the caller can log why it skipped.
 */
export async function claimReminder(
  client: ReminderLogClient,
  key: ReminderKey,
): Promise<ClaimOutcome> {
  const logId = reminderLogId(key)
  const runId = crypto.randomUUID()

  await client.createIfNotExists<ReminderLogDoc>({
    _id: logId,
    _type: 'reminderLog',
    conference: {_type: 'reference', _ref: key.conferenceId, _weak: true},
    reminder: key.reminder,
    milestoneDate: key.milestoneDate,
    runId,
    status: 'claimed',
    claimedAt: new Date().toISOString(),
  })

  // createIfNotExists is a no-op when the document exists, so read back to see
  // whose runId stuck. Anything other than ours means another run owns it.
  const log = (await client.getDocument<ReminderLogDoc>(logId)) ?? null
  if (log?.runId === runId) {
    return {claimed: true, log}
  }
  return {claimed: false, log}
}

/**
 * Record how the send went on the log document this run claimed. A document
 * left at `claimed` means the run died mid-send; deleting it lets the next run resend.
 */
export async function recordReminderOutcome(
  client: ReminderLogClient,
  logId: string,
  outcome: {status: Exclude<ReminderLogStatus, 'claimed'>; details: string},
): Promise<void> {
  const patch = client.patch(logId).set({status: outcome.status, details: outcome.details})
  if (outcome.status === 'sent') {
    patch.set({sentAt: new Date().toISOString()})
  }
  await patch.commit()
}
