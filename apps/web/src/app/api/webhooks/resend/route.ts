import {NextResponse} from 'next/server'
import {createClient} from 'next-sanity'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-11-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

interface ResendWebhookEvent {
  type: string
  data: {
    email_id: string
    to: string[]
    subject: string
    created_at: string
    tags?: Array<{name: string; value: string}>
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()

    // Verify webhook signature if secret is configured
    const signature = request.headers.get('svix-signature')
    if (process.env.RESEND_WEBHOOK_SECRET && !signature) {
      return NextResponse.json({error: 'Missing signature'}, {status: 401})
    }

    // TODO: Add full svix signature verification when @svix/webhooks is added
    // For now, we verify the webhook secret is present as a basic check

    const event = JSON.parse(body) as ResendWebhookEvent

    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.delivery_delayed': 'sent',
      'email.complained': 'complained',
    }

    const status = statusMap[event.type]
    if (!status) {
      // Unhandled event type — acknowledge but don't process
      return NextResponse.json({received: true})
    }

    const emailId = event.data.email_id

    // Try to find existing emailLog by resendId
    const existing = await client.fetch<{_id: string} | null>(
      `*[_type == "emailLog" && resendId == $resendId][0]{_id}`,
      {resendId: emailId},
    )

    if (existing) {
      // Update existing log entry
      await client.patch(existing._id).set({status}).commit()
    } else {
      // Create new log entry (for events where we didn't create one at send time)
      await client.create({
        _type: 'emailLog',
        resendId: emailId,
        to: event.data.to?.[0],
        subject: event.data.subject,
        sentAt: event.data.created_at,
        status,
        template: event.data.tags?.find((t) => t.name === 'category')?.value,
      })
    }

    return NextResponse.json({received: true})
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({error: 'Webhook processing failed'}, {status: 500})
  }
}
