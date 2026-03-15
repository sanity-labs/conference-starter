import {NextResponse} from 'next/server'
import {render} from '@react-email/render'
import {EmailLayout, PortableTextEmail} from '@repo/email'
import {createElement} from 'react'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new Response(null, {status: 204, headers: CORS_HEADERS})
}

export async function POST(request: Request) {
  try {
    const {subject, body, variables} = await request.json()

    if (!body || !Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {error: 'Email body is required'},
        {status: 400, headers: CORS_HEADERS},
      )
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

    return NextResponse.json({html}, {headers: CORS_HEADERS})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to render email'
    return NextResponse.json({error: message}, {status: 500, headers: CORS_HEADERS})
  }
}
