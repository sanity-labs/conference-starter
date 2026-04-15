import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {Resend} from 'resend'
import {wrapInLayout} from '../_shared/email-render'
import {
  formatEmailHtml,
  appendLog,
  type AnnouncementData,
} from '../_shared/announcement-format'

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'ContentOps Conf <noreply@contentopsconf.dev>'

export const handler = documentEventHandler<AnnouncementData>(async ({context, event}) => {
  const {data} = event
  const dryRun = Boolean(context.local)
  const client = createClient({...context.clientOptions, apiVersion: '2025-08-15'})

  const isResend = Array.isArray(data.distributionLog) &&
    data.distributionLog.some((e) => e.channel === 'email')

  const bodyHtml = formatEmailHtml(data, isResend)
  const subject = isResend
    ? `[Update] ${data.title || 'Announcement'}`
    : data.title || 'Announcement'
  const html = wrapInLayout(bodyHtml, subject)

  if (dryRun) {
    console.log(`[dry-run] Would send announcement email: "${subject}"`)
    console.log(`[dry-run] HTML length: ${html.length} chars`)
    console.log(`[dry-run] Is resend: ${isResend}`)
    return
  }

  // Set publishedAt on first publish (not resend)
  if (!isResend) {
    await client.patch(data._id).set({publishedAt: new Date().toISOString()}).commit()
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured, skipping announcement email')
    await appendLog(client, data._id, {
      channel: 'email',
      status: 'error',
      details: 'RESEND_API_KEY not configured',
    })
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  // Send to audience if configured, otherwise fallback to test address
  const audienceId = process.env.RESEND_AUDIENCE_ID
  const sendPayload = audienceId
    ? {
        from: FROM_ADDRESS,
        to: audienceId,
        subject,
        html,
        tags: [{name: 'category', value: 'announcement'}],
      }
    : {
        from: FROM_ADDRESS,
        to: ['delivered@resend.dev'],
        subject,
        html,
        tags: [{name: 'category', value: 'announcement'}],
      }

  const {error} = await resend.emails.send(sendPayload)

  if (error) {
    console.error(`Failed to send announcement email for ${data._id}:`, error)
    await appendLog(client, data._id, {
      channel: 'email',
      status: 'error',
      details: JSON.stringify(error),
    })
    return
  }

  const target = audienceId ? `audience ${audienceId}` : 'delivered@resend.dev'
  console.log(`Announcement email sent: "${subject}" to ${target}`)
  await appendLog(client, data._id, {
    channel: 'email',
    status: 'sent',
    details: `Sent to ${target}${isResend ? ' (update)' : ''}`,
  })
})
