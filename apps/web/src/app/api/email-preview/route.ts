import {NextResponse} from 'next/server'
import {renderEmailBody, wrapInLayout, interpolateSubject} from '@repo/email/render-html'

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

    const bodyHtml = renderEmailBody(body, interpolationValues)

    const previewSubject = interpolationValues
      ? interpolateSubject(subject || 'Email Preview', interpolationValues)
      : subject || 'Email Preview'

    const html = wrapInLayout(bodyHtml, previewSubject)

    return NextResponse.json({html}, {headers: CORS_HEADERS})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to render email'
    return NextResponse.json({error: message}, {status: 500, headers: CORS_HEADERS})
  }
}
