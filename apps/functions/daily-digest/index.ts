/**
 * Daily Digest — scheduled function.
 *
 * Runs at 7:00 AM conference timezone. Sends schedule email + Telegram post:
 * - Day before conference: "Tomorrow's schedule" preview
 * - During conference days: "Today at ContentOps Conf"
 * - Otherwise: exits silently
 */

import {scheduledEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {Resend} from 'resend'
import {
  getTodayInTimezone,
  toDateString,
  daysBetween,
  isConferenceDay,
  formatDateForDisplay,
} from '../_shared/conference-date-utils'
import {
  CONFERENCE_CONFIG_QUERY,
  SCHEDULE_DIGEST_QUERY,
  EMAIL_TEMPLATE_BY_SLUG_QUERY,
} from '../_shared/scheduled-queries'
import {renderEmailBody, wrapInLayout, interpolateSubject} from '../_shared/email-render'
import {formatScheduleEmailHtml, formatScheduleTelegramHtml} from '../_shared/schedule-format'
import type {DigestSlot} from '../_shared/schedule-format'

const TIMEZONE = process.env.CONFERENCE_TIMEZONE || 'America/New_York'
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'ContentOps Conf <noreply@contentops.dev>'
const SITE_URL = process.env.SITE_URL || 'https://contentops-conf.sanity.dev'

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

export const handler = scheduledEventHandler(async ({context}) => {
  const dryRun = Boolean(context.local)
  const client = createClient({...context.clientOptions, apiVersion: '2025-08-15'})

  // 1. Fetch conference config
  const conf = await client.fetch<ConferenceConfig | null>(CONFERENCE_CONFIG_QUERY)
  if (!conf?.startDate || !conf?.endDate) {
    console.log('No conference with dates found — skipping digest.')
    return
  }

  const today = getTodayInTimezone(TIMEZONE)
  const startDateStr = toDateString(conf.startDate, TIMEZONE)
  const endDateStr = toDateString(conf.endDate, TIMEZONE)
  const conferenceName = conf.name || 'ContentOps Conf'

  // 2. Determine what to send
  const isDayBefore = daysBetween(today, startDateStr) === 1
  const isConfDay = isConferenceDay(today, conf.startDate, conf.endDate, TIMEZONE)

  if (!isDayBefore && !isConfDay) {
    console.log(`Today (${today}) is not a digest day. Conference: ${startDateStr} – ${endDateStr}`)
    return
  }

  // Day before → show tomorrow's schedule; conference day → show today's schedule
  const targetDate = isDayBefore ? startDateStr : today
  const templateSlug = isDayBefore ? 'digest-preview' : 'digest-day'
  const scheduleDate = formatDateForDisplay(targetDate)

  console.log(`Sending ${templateSlug} digest for ${scheduleDate}`)

  // 3. Fetch schedule slots for the target day
  const dayStart = `${targetDate}T00:00:00`
  const dayEnd = `${targetDate}T23:59:59`
  const slots = await client.fetch<DigestSlot[]>(SCHEDULE_DIGEST_QUERY, {
    conferenceId: conf._id,
    dayStart,
    dayEnd,
  })
  console.log(`Found ${slots.length} schedule slot(s) for ${targetDate}`)

  // 4. Fetch email template
  const template = await client.fetch<EmailTemplate | null>(EMAIL_TEMPLATE_BY_SLUG_QUERY, {
    slug: templateSlug,
  })
  if (!template) {
    console.error(`Email template "${templateSlug}" not found or not active — skipping.`)
    return
  }

  // 5. Build variables and render
  const variables: Record<string, string> = {
    conferenceName,
    scheduleDate,
  }

  const subject = interpolateSubject(template.subject, variables)
  const bodyHtml = renderEmailBody(template.body as unknown[], variables)
  const scheduleHtml = formatScheduleEmailHtml(slots, SITE_URL)
  const html = wrapInLayout(bodyHtml + scheduleHtml, subject)

  // 6. Send email
  if (dryRun) {
    console.log(`[dry-run] Would send "${subject}" (${html.length} chars)`)
    console.log(`[dry-run] Schedule: ${slots.length} slots`)
  } else {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured — skipping email send.')
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const audienceId = process.env.RESEND_AUDIENCE_ID
      const {error} = await resend.emails.send({
        from: FROM_ADDRESS,
        to: audienceId || 'delivered@resend.dev',
        subject,
        html,
        tags: [{name: 'category', value: 'daily-digest'}],
      })
      if (error) {
        console.error('Failed to send digest email:', error)
      } else {
        const target = audienceId ? `audience ${audienceId}` : 'delivered@resend.dev'
        console.log(`Digest email sent: "${subject}" to ${target}`)
      }
    }
  }

  // 7. Post to Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID
  if (!botToken || !channelId) {
    console.log('Telegram not configured — skipping Telegram post.')
    return
  }

  const telegramTitle = isDayBefore
    ? `\u{1F4C5} <b>Tomorrow at ${conferenceName}: ${scheduleDate}</b>`
    : `\u{2615} <b>Today at ${conferenceName}: ${scheduleDate}</b>`
  const telegramSchedule = formatScheduleTelegramHtml(slots, SITE_URL)
  const telegramText = `${telegramTitle}\n\n${telegramSchedule}`

  if (dryRun) {
    console.log(`[dry-run] Would post to Telegram (${telegramText.length} chars)`)
    return
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: channelId,
      text: telegramText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`Telegram send failed (${response.status}): ${body}`)
  } else {
    console.log('Digest posted to Telegram')
  }
})
