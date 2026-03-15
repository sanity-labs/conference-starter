import {NextResponse} from 'next/server'
import {render} from '@react-email/render'
import {EmailLayout, PortableTextEmail, resend} from '@repo/email'
import {createElement} from 'react'

export async function POST(request: Request) {
  try {
    const {to, subject, body, variables} = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json({error: 'Missing required fields: to, subject, body'}, {status: 400})
    }

    const interpolationValues = (variables ?? {}) as Record<string, string>

    // Interpolate {{variables}} in subject
    const resolvedSubject = `[TEST] ${(subject as string).replace(
      /\{\{(\w+)\}\}/g,
      (_: string, key: string) => interpolationValues[key] ?? `{{${key}}}`,
    )}`

    const children = createElement(PortableTextEmail, {
      value: body,
      interpolationValues,
    })

    const element = createElement(EmailLayout, {
      preview: resolvedSubject,
      conferenceName: 'Everything NYC 2026',
      children,
    })

    const html = await render(element)

    const fromAddress = process.env.RESEND_FROM_ADDRESS || 'Everything NYC <noreply@everything.nyc>'

    const {data, error} = await resend().emails.send({
      from: fromAddress,
      to: [to],
      subject: resolvedSubject,
      html,
      tags: [{name: 'category', value: 'test'}],
    })

    if (error) {
      return NextResponse.json({error: error.message}, {status: 500})
    }

    return NextResponse.json({success: true, id: data?.id})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send test email'
    return NextResponse.json({error: message}, {status: 500})
  }
}
