import {documentEventHandler} from '@sanity/functions'
import {Resend} from 'resend'

interface SubmissionEvent {
  _id: string
  sessionTitle: string
  submitterName: string
  submitterEmail: string
  status: string
}

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'Everything NYC <noreply@everything.nyc>'

export const handler = documentEventHandler<SubmissionEvent>(async ({event}) => {
  const {data} = event

  // Only send emails for accepted or rejected status
  if (data.status !== 'accepted' && data.status !== 'rejected') {
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured, skipping status email')
    return
  }

  if (!data.submitterEmail) {
    console.error(`Submission ${data._id} has no submitter email, skipping`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const isAccepted = data.status === 'accepted'
  const subject = isAccepted
    ? `Your talk "${data.sessionTitle}" has been accepted!`
    : `Update on your submission: ${data.sessionTitle}`

  const html = isAccepted
    ? buildAcceptedHtml({submitterName: data.submitterName, sessionTitle: data.sessionTitle})
    : buildRejectedHtml({submitterName: data.submitterName, sessionTitle: data.sessionTitle})

  const {error} = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [data.submitterEmail],
    subject,
    html,
    tags: [{name: 'category', value: `cfp-${data.status}`}],
  })

  if (error) {
    console.error(`Failed to send ${data.status} email for ${data._id}:`, error)
    return
  }

  console.log(`${data.status} email sent to ${data.submitterEmail} for submission ${data._id}`)
})

function buildAcceptedHtml({
  submitterName,
  sessionTitle,
}: {
  submitterName: string
  sessionTitle: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;margin:0;padding:40px 0">
<div style="background-color:#ffffff;border-radius:8px;margin:0 auto;max-width:600px;overflow:hidden">
  <div style="background-color:#18181b;padding:24px 32px">
    <p style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;margin:0">Everything NYC 2026</p>
  </div>
  <div style="padding:32px">
    <h1 style="color:#18181b;font-size:24px;font-weight:700;line-height:1.3;margin:0 0 20px">Your Talk Has Been Accepted!</h1>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Hi ${escapeHtml(submitterName)},</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Great news! We're thrilled to let you know that <strong>${escapeHtml(sessionTitle)}</strong> has been accepted for Everything NYC 2026.</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">We received many outstanding proposals and yours stood out. We can't wait for you to share your ideas with our audience.</p>
    <p style="color:#18181b;font-size:17px;font-weight:600;line-height:1.3;margin:0 0 8px">Next Steps</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 4px;padding-left:8px">1. Confirm your participation by replying to this email</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 4px;padding-left:8px">2. We'll create your speaker profile on our website</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px;padding-left:8px">3. You'll receive a speaker welcome email with logistics details</p>
    <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0">If you can no longer present, please let us know as soon as possible so we can offer the slot to another speaker.</p>
  </div>
  <hr style="border-color:#e4e4e7;border-top:1px solid #e4e4e7;margin:0">
  <div style="padding:24px 32px">
    <p style="color:#71717a;font-size:13px;margin:0">Everything NYC 2026 · New York City</p>
  </div>
</div>
</body>
</html>`
}

function buildRejectedHtml({
  submitterName,
  sessionTitle,
}: {
  submitterName: string
  sessionTitle: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;margin:0;padding:40px 0">
<div style="background-color:#ffffff;border-radius:8px;margin:0 auto;max-width:600px;overflow:hidden">
  <div style="background-color:#18181b;padding:24px 32px">
    <p style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;margin:0">Everything NYC 2026</p>
  </div>
  <div style="padding:32px">
    <h1 style="color:#18181b;font-size:24px;font-weight:700;line-height:1.3;margin:0 0 20px">Thank You for Submitting</h1>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Hi ${escapeHtml(submitterName)},</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Thank you for submitting <strong>${escapeHtml(sessionTitle)}</strong> to Everything NYC 2026. We appreciate the time and effort you put into your proposal.</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">After careful review, we're unable to include your session in this year's program. We received an exceptional number of submissions and the selection process was highly competitive.</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">This doesn't reflect on the quality of your work — we encourage you to submit again in the future and to join us as an attendee. We'd love to see you there.</p>
    <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0">If you have questions about our review process, feel free to reply to this email.</p>
  </div>
  <hr style="border-color:#e4e4e7;border-top:1px solid #e4e4e7;margin:0">
  <div style="padding:24px 32px">
    <p style="color:#71717a;font-size:13px;margin:0">Everything NYC 2026 · New York City</p>
  </div>
</div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
