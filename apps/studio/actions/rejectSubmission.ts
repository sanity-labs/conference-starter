import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {CloseCircleIcon} from '@sanity/icons'

export const rejectSubmission: DocumentActionComponent = (props) => {
  const {id, type, published, draft} = props
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2026-03-15'})
  const doc = (draft || published) as Record<string, unknown> | null

  if (type !== 'submission') return null

  const status = doc?.status as string | undefined
  if (!status || !['scored', 'in-review'].includes(status)) return null

  return {
    label: isRunning ? 'Rejecting...' : 'Reject Submission',
    icon: CloseCircleIcon,
    tone: 'critical' as const,
    disabled: isRunning,
    onHandle: async () => {
      setIsRunning(true)

      try {
        await client.patch(id).set({status: 'rejected'}).commit()
        // The send-status-email function handles sending the rejection email
        console.log(`Submission ${id} rejected`)
        props.onComplete()
      } catch (error) {
        console.error('Failed to reject submission:', error)
      } finally {
        setIsRunning(false)
      }
    },
  }
}
