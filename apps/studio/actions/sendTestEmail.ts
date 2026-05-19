import {useState} from 'react'
import {useCurrentUser} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'

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
  const toast = useToast()

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
          const data = await res.json().catch(() => ({error: `HTTP ${res.status}`}))
          toast.push({
            status: 'error',
            title: 'Test email failed',
            description: data.error ?? `HTTP ${res.status}`,
            closable: true,
          })
        } else {
          const data = await res.json().catch(() => ({id: undefined}))
          toast.push({
            status: 'success',
            title: `Test email sent to ${recipient}`,
            description: data.id ? `Resend id: ${data.id}` : undefined,
            closable: true,
          })
        }
      } catch (error) {
        toast.push({
          status: 'error',
          title: 'Test email failed',
          description: error instanceof Error ? error.message : String(error),
          closable: true,
        })
      } finally {
        setIsSending(false)
        props.onComplete()
      }
    },
  }
}
