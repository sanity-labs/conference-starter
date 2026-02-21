import {documentEventHandler} from '@sanity/functions'
import {Resend} from 'resend'

interface SubmissionEvent {
  _id: string
  sessionTitle: string
  submitterName: string
  submitterEmail: string
}

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'Everything NYC <noreply@everything.nyc>'

export const handler = documentEventHandler<SubmissionEvent>(async ({event}) => {
  const {data} = event

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured, skipping confirmation email')
    return
  }

  if (!data.submitterEmail) {
    console.error(`Submission ${data._id} has no submitter email, skipping`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const html = buildConfirmationHtml({
    submitterName: data.submitterName,
    sessionTitle: data.sessionTitle,
  })

  const {error} = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [data.submitterEmail],
    subject: `Submission received: ${data.sessionTitle}`,
    html,
    tags: [{name: 'category', value: 'cfp-confirmation'}],
  })

  if (error) {
    console.error(`Failed to send confirmation email for ${data._id}:`, error)
    return
  }

  console.log(`Confirmation email sent to ${data.submitterEmail} for submission ${data._id}`)
})

function buildConfirmationHtml({
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
    <h1 style="color:#18181b;font-size:24px;font-weight:700;line-height:1.3;margin:0 0 20px">Submission Received</h1>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Hi ${escapeHtml(submitterName)},</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Thanks for submitting <strong>${escapeHtml(sessionTitle)}</strong> to Everything NYC 2026! We're excited to review your proposal.</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">Here's what happens next:</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 4px;padding-left:8px">1. Your submission will be screened by our AI-assisted review system</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 4px;padding-left:8px">2. Our editorial team will review top-scoring proposals</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px;padding-left:8px">3. You'll receive a decision via email</p>
    <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 16px">This process typically takes 2-3 weeks. We'll keep you posted on any updates.</p>
    <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0">If you have questions about your submission, reply to this email.</p>
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
