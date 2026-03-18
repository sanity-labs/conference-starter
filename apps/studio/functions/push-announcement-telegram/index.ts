import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {
  formatTelegramHtml,
  appendLog,
  type AnnouncementData,
} from '../_shared/announcement-format'

export const handler = documentEventHandler<AnnouncementData>(async ({context, event}) => {
  const {data} = event
  const dryRun = Boolean(context.local)
  const client = createClient({...context.clientOptions, apiVersion: '2025-08-15'})

  const isResend = Array.isArray(data.distributionLog) &&
    data.distributionLog.some((e) => e.channel === 'telegram')

  const text = formatTelegramHtml(data, isResend)

  if (dryRun) {
    console.log(`[dry-run] Would post to Telegram: ${text.slice(0, 200)}...`)
    console.log(`[dry-run] Is resend: ${isResend}`)
    return
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID

  if (!botToken || !channelId) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not configured')
    await appendLog(client, data._id, {
      channel: 'telegram',
      status: 'error',
      details: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID',
    })
    return
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    console.error(`Telegram API error for ${data._id}: ${response.status} ${body}`)
    await appendLog(client, data._id, {
      channel: 'telegram',
      status: 'error',
      details: `${response.status}: ${body.slice(0, 200)}`,
    })
    return
  }

  console.log(`Announcement posted to Telegram channel ${channelId}`)
  await appendLog(client, data._id, {
    channel: 'telegram',
    status: 'sent',
    details: `Posted to ${channelId}${isResend ? ' (update)' : ''}`,
  })
})
