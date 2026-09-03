import {defineField, defineType} from 'sanity'
import {ClockIcon} from '@sanity/icons'

/**
 * Idempotency record for the reminder-cron scheduled function.
 *
 * One document per conference + reminder + milestone date, with a deterministic
 * ID (`reminderLog.{conferenceId}.{reminder}.{YYYY-MM-DD}`). The function
 * claims the document with createIfNotExists *before* sending, so a platform
 * retry or a manual re-run finds the claim and skips instead of emailing the
 * whole audience again. See `apps/functions/_shared/reminder-log.ts`.
 */
export const reminderLog = defineType({
  name: 'reminderLog',
  title: 'Reminder Log',
  type: 'document',
  description:
    'Record of a scheduled reminder that was sent (or claimed). Written by the reminder-cron function so retries never re-send.',
  icon: ClockIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'conference',
      title: 'Conference',
      type: 'reference',
      to: [{type: 'conference'}],
      weak: true,
    }),
    defineField({
      name: 'reminder',
      title: 'Reminder',
      type: 'string',
      description: 'Email template slug of the reminder, e.g. "cfp-closing-soon" or "event-reminder-week".',
    }),
    defineField({
      name: 'milestoneDate',
      title: 'Milestone Date',
      type: 'date',
      description:
        'The date the reminder is about — the CFP deadline, conference start, or conference end. If that date moves, the reminder is treated as new and sends again.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Claimed', value: 'claimed'},
          {title: 'Sent', value: 'sent'},
          {title: 'Error', value: 'error'},
        ],
      },
      description:
        '"Claimed" means a run took ownership but never finished. Delete the document to let the next run send it again.',
    }),
    defineField({
      name: 'runId',
      title: 'Run ID',
      type: 'string',
      description: 'Random token of the invocation that won the claim.',
    }),
    defineField({
      name: 'claimedAt',
      title: 'Claimed At',
      type: 'datetime',
    }),
    defineField({
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'text',
      rows: 3,
      description: 'Per-channel outcome (email, Telegram) from the run that owned this reminder.',
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'claimedAtDesc',
      by: [{field: 'claimedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {reminder: 'reminder', milestoneDate: 'milestoneDate', status: 'status', claimedAt: 'claimedAt'},
    prepare({reminder, milestoneDate, status, claimedAt}) {
      const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
      const dateLabel = claimedAt ? new Date(claimedAt as string).toLocaleString() : ''
      return {
        title: [reminder || 'Reminder', milestoneDate].filter(Boolean).join(' · '),
        subtitle: [statusLabel, dateLabel].filter(Boolean).join(' · '),
      }
    },
  },
})
