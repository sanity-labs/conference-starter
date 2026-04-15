import {render} from '@react-email/render'
import {Resend} from 'resend'
import type {ReactElement} from 'react'

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'ContentOps Conf <noreply@contentopsconf.dev>'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export {getResend as resend}

interface SendEmailOptions {
  to: string | string[]
  subject: string
  tags?: Array<{name: string; value: string}>
  from?: string
  replyTo?: string
}

export async function sendEmail(template: ReactElement, options: SendEmailOptions) {
  const resend = getResend()
  const html = await render(template)

  const {data, error} = await resend.emails.send({
    from: options.from || FROM_ADDRESS,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html,
    replyTo: options.replyTo,
    tags: options.tags,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

interface BatchEmail {
  template: ReactElement
  options: SendEmailOptions
}

export async function sendBatch(emails: BatchEmail[]) {
  const resend = getResend()

  const rendered = await Promise.all(
    emails.map(async ({template, options}) => ({
      from: options.from || FROM_ADDRESS,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: await render(template),
      replyTo: options.replyTo,
      tags: options.tags,
    })),
  )

  const {data, error} = await resend.batch.send(rendered)

  if (error) {
    throw new Error(`Failed to send batch: ${error.message}`)
  }

  return data
}
