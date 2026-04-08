/**
 * Reminder Cron — scheduled function.
 *
 * Runs at 8:00 AM conference timezone. Checks milestone dates and sends
 * the appropriate reminder email + Telegram post:
 * - CFP closes in 2 days
 * - CFP closes today
 * - Conference starts in 1 week
 * - Conference starts tomorrow
 * - Conference ended yesterday (thank-you)
 */

import {scheduledEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {Resend} from 'resend'
import {
  getTodayInTimezone,
  toDateString,
  daysBetween,
  formatDatetimeForDisplay,
  daysUntilLabel,
} from '../_shared/conference-date-utils'
import {CONFERENCE_CONFIG_QUERY, EMAIL_TEMPLATE_BY_SLUG_QUERY} from '../_shared/scheduled-queries'
import {renderEmailBody, wrapInLayout, interpolateSubject} from '../_shared/email-render'

const TIMEZONE = process.env.CONFERENCE_TIMEZONE || 'America/New_York'
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'ContentOps Conf <noreply@contentops.dev>'

interface ConferenceConfig {
  _id: string
  name: string | null
  slug: string | null
  startDate: string | null
  endDate: string | null
  cfpOpen: boolean | null
  cfpDeadline: string | null
}

interface EmailTemplate {
  _id: string
  name: string
  subject: string
  body: unknown[]
  audience: string | null
  trigger: string | null
}

interface ReminderMatch {
  slug: string
  variables: Record<string, string>
  label: string
}

export const handler = scheduledEventHandler(async ({context}) => {
  const dryRun = Boolean(context.local)
  const client = createClient({...context.clientOptions, apiVersion: '2025-08-15'})

  // 1. Fetch conference config
  const conf = await client.fetch<ConferenceConfig | null>(CONFERENCE_CONFIG_QUERY)
  if (!conf?.startDate || !conf?.endDate) {
    console.log('No conference with dates found — skipping reminders.')
    return
  }

  const today = getTodayInTimezone(TIMEZONE)
  const startDateStr = toDateString(conf.startDate, TIMEZONE)
  const endDateStr = toDateString(conf.endDate, TIMEZONE)
  const conferenceName = conf.name || 'ContentOps Conf'

  const daysToStart = daysBetween(today, startDateStr)
  const daysSinceEnd = daysBetween(endDateStr, today)

  // 2. Check each reminder condition
  const reminders: ReminderMatch[] = []

  // CFP reminders (only if CFP is open and deadline is set)
  if (conf.cfpOpen && conf.cfpDeadline) {
    const cfpDeadlineStr = toDateString(conf.cfpDeadline, TIMEZONE)
    const daysToCfp = daysBetween(today, cfpDeadlineStr)

    if (daysToCfp === 2) {
      reminders.push({
        slug: 'cfp-closing-soon',
        label: 'CFP closing in 2 days',
        variables: {
          conferenceName,
          cfpDeadlineDate: formatDatetimeForDisplay(conf.cfpDeadline),
          daysUntilEvent: daysUntilLabel(daysToCfp),
        },
      })
    }

    if (daysToCfp === 0) {
      reminders.push({
        slug: 'cfp-closing-today',
        label: 'CFP closing today',
        variables: {
          conferenceName,
          cfpDeadlineDate: formatDatetimeForDisplay(conf.cfpDeadline),
        },
      })
    }
  }

  // Event reminders
  if (daysToStart === 7) {
    reminders.push({
      slug: 'event-reminder-week',
      label: 'Conference in 1 week',
      variables: {
        conferenceName,
        daysUntilEvent: daysUntilLabel(daysToStart),
      },
    })
  }

  if (daysToStart === 1) {
    reminders.push({
      slug: 'event-reminder-tomorrow',
      label: 'Conference starts tomorrow',
      variables: {conferenceName},
    })
  }

  // Post-event thank you (day after conference ends)
  if (daysSinceEnd === 1) {
    reminders.push({
      slug: 'post-event-thanks',
      label: 'Post-event thank you',
      variables: {conferenceName},
    })
  }

  if (reminders.length === 0) {
    console.log(`No reminders match for today (${today}). Start: ${startDateStr}, End: ${endDateStr}`)
    return
  }

  console.log(`${reminders.length} reminder(s) to send: ${reminders.map((r) => r.label).join(', ')}`)

  // 3. Send each matching reminder
  const resend = !dryRun && process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null
  const audienceId = process.env.RESEND_AUDIENCE_ID
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID

  for (const reminder of reminders) {
    const template = await client.fetch<EmailTemplate | null>(EMAIL_TEMPLATE_BY_SLUG_QUERY, {
      slug: reminder.slug,
    })

    if (!template) {
      console.error(`Template "${reminder.slug}" not found or not active — skipping "${reminder.label}".`)
      continue
    }

    const subject = interpolateSubject(template.subject, reminder.variables)
    const bodyHtml = renderEmailBody(template.body as unknown[], reminder.variables)
    const html = wrapInLayout(bodyHtml, subject)

    // Send email
    if (dryRun) {
      console.log(`[dry-run] Would send "${subject}" (${html.length} chars)`)
    } else if (resend) {
      const {error} = await resend.emails.send({
        from: FROM_ADDRESS,
        to: audienceId || 'delivered@resend.dev',
        subject,
        html,
        tags: [{name: 'category', value: 'reminder'}],
      })
      if (error) {
        console.error(`Failed to send "${reminder.label}" email:`, error)
      } else {
        const target = audienceId ? `audience ${audienceId}` : 'delivered@resend.dev'
        console.log(`Reminder email sent: "${subject}" to ${target}`)
      }
    } else {
      console.error('RESEND_API_KEY not configured — skipping email.')
    }

    // Post to Telegram
    if (botToken && channelId) {
      const telegramText = `\u{1F514} <b>${subject}</b>\n\n${bodyHtml.replace(/<[^>]+>/g, '')}`

      if (dryRun) {
        console.log(`[dry-run] Would post to Telegram: "${subject}"`)
      } else {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            chat_id: channelId,
            text: telegramText.slice(0, 4096), // Telegram message limit
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        })
        if (!response.ok) {
          const body = await response.text()
          console.error(`Telegram send failed for "${reminder.label}" (${response.status}): ${body}`)
        } else {
          console.log(`Reminder posted to Telegram: "${reminder.label}"`)
        }
      }
    }
  }

  console.log('Reminder cron complete.')
})
