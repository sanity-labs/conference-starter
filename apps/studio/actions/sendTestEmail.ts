import {useState} from 'react'
import {useCurrentUser} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

const PREVIEW_API_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'
const TEST_RECIPIENT_OVERRIDE = process.env.SANITY_STUDIO_TEST_RECIPIENT

const sampleVariables: Record<string, string> = {
  submitterName: 'Alex Johnson',
  sessionTitle: 'Building AI-Powered Content Platforms',
  speakerName: 'Alex Johnson',
  conferenceName: 'ContentOps Conf',
}

export const sendTestEmail: DocumentActionComponent = (props) => {
  const {type, draft, published} = props
  const [isSending, setIsSending] = useState(false)
  const currentUser = useCurrentUser()

  if (type !== 'emailTemplate') return null

  const doc = (draft || published) as Record<string, unknown> | null
  if (!doc?.body || !doc?.subject) return null

  return {
    label: isSending ? 'Sending...' : 'Send Test Email',
    icon: EnvelopeIcon,
    tone: 'default' as const,
    disabled: isSending || !(TEST_RECIPIENT_OVERRIDE || currentUser?.email),
    onHandle: async () => {
      const recipient = TEST_RECIPIENT_OVERRIDE || currentUser?.email
      if (!recipient) return

      setIsSending(true)

      try {
        const studioSecret = process.env.SANITY_STUDIO_SEND_SECRET
        const headers: Record<string, string> = {'Content-Type': 'application/json'}
        if (studioSecret) headers['x-studio-secret'] = studioSecret

        const res = await fetch(`${PREVIEW_API_URL}/api/send-test-email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: recipient,
            subject: doc.subject,
            body: doc.body,
            variables: sampleVariables,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          console.error('Send test email failed:', data.error)
        } else {
          console.log(`Test email sent to ${recipient}`)
        }
      } catch (error) {
        console.error('Send test email failed:', error)
      } finally {
        setIsSending(false)
        props.onComplete()
      }
    },
  }
}
