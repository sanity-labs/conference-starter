import {NextResponse} from 'next/server'
import {renderEmailBody, wrapInLayout, interpolateSubject} from '@repo/email/render-html'
import {resend} from '@repo/email/send'

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
    const {to, subject, body, variables} = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        {error: 'Missing required fields: to, subject, body'},
        {status: 400, headers: CORS_HEADERS},
      )
    }

    const interpolationValues = (variables ?? {}) as Record<string, string>

    const resolvedSubject = `[TEST] ${interpolateSubject(subject as string, interpolationValues)}`

    const bodyHtml = renderEmailBody(body, interpolationValues)
    const html = wrapInLayout(bodyHtml, resolvedSubject)

    const fromAddress = process.env.RESEND_FROM_ADDRESS || 'Everything NYC <noreply@everything.nyc>'

    const {data, error} = await resend().emails.send({
      from: fromAddress,
      to: [to],
      subject: resolvedSubject,
      html,
      tags: [{name: 'category', value: 'test'}],
    })

    if (error) {
      return NextResponse.json({error: error.message}, {status: 500, headers: CORS_HEADERS})
    }

    return NextResponse.json({success: true, id: data?.id}, {headers: CORS_HEADERS})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send test email'
    return NextResponse.json({error: message}, {status: 500, headers: CORS_HEADERS})
  }
}
