import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {Resend} from 'resend'
import {renderEmailBody, wrapInLayout, interpolateSubject} from '../_shared/email-render'

interface SubmissionEvent {
  _id: string
  sessionTitle: string
  submitterName: string
  submitterEmail: string
}

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'ContentOps Conf <noreply@contentopsconf.dev>'

export const handler = documentEventHandler<SubmissionEvent>(async ({context, event}) => {
  const {data} = event
  const dryRun = Boolean(context.local)

  if (!data.submitterEmail) {
    console.error(`Submission ${data._id} has no submitter email, skipping`)
    return
  }

  const client = createClient({...context.clientOptions, apiVersion: 'vX'})

  const template = await client.fetch<{subject: string; body: unknown[]} | null>(
    `*[_type == "emailTemplate" && trigger == "on-submission-received" && status == "active"][0]{subject, body}`,
  )

  if (!template) {
    console.error('No active email template found for trigger "on-submission-received"')
    return
  }

  const variables: Record<string, string> = {
    submitterName: data.submitterName,
    sessionTitle: data.sessionTitle,
    conferenceName: 'ContentOps Conf',
  }

  const bodyHtml = renderEmailBody(template.body, variables)
  const subject = interpolateSubject(template.subject, variables)
  const html = wrapInLayout(bodyHtml, subject)

  if (dryRun) {
    console.log(`[dry-run] Would send confirmation email to ${data.submitterEmail}`)
    console.log(`[dry-run] Subject: ${subject}`)
    console.log(`[dry-run] HTML length: ${html.length} chars`)
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured, skipping confirmation email')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const {error} = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [data.submitterEmail],
    subject,
    html,
    tags: [{name: 'category', value: 'cfp-confirmation'}],
  })

  if (error) {
    console.error(`Failed to send confirmation email for ${data._id}:`, error)
    return
  }

  console.log(`Confirmation email sent to ${data.submitterEmail} for submission ${data._id}`)
})
