import {NextResponse} from 'next/server'
import {render} from '@react-email/render'
import {EmailLayout, PortableTextEmail} from '@repo/email'
import {createElement} from 'react'

export async function POST(request: Request) {
  try {
    const {subject, body, variables} = await request.json()

    if (!body || !Array.isArray(body) || body.length === 0) {
      return NextResponse.json({error: 'Email body is required'}, {status: 400})
    }

    const interpolationValues = variables as Record<string, string> | undefined

    const children = createElement(PortableTextEmail, {
      value: body,
      interpolationValues,
    })

    const previewSubject = interpolationValues
      ? (subject || 'Email Preview').replace(
          /\{\{(\w+)\}\}/g,
          (_: string, key: string) => interpolationValues[key] ?? `{{${key}}}`,
        )
      : subject || 'Email Preview'

    const element = createElement(EmailLayout, {
      preview: previewSubject,
      conferenceName: 'Everything NYC 2026',
      children,
    })

    const html = await render(element)

    return NextResponse.json({html})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to render email'
    return NextResponse.json({error: message}, {status: 500})
  }
}
