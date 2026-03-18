import {useState, useCallback} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {BellIcon} from '@sanity/icons'

export const sendUpdate: DocumentActionComponent = (props) => {
  const {type, published} = props
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2025-08-15'})

  const onHandle = useCallback(async () => {
    if (!published?._id) return

    setIsRunning(true)
    try {
      // Toggle status: published → ready → published
      // This re-triggers the Functions' delta::changedAny(status) filter.
      // The functions detect a resend via existing distributionLog entries.
      await client.patch(published._id).set({status: 'ready'}).commit()
      await client.patch(published._id).set({status: 'published'}).commit()
    } catch (error) {
      console.error('Failed to resend announcement:', error)
    } finally {
      setIsRunning(false)
      props.onComplete()
    }
  }, [client, published, props])

  if (type !== 'announcement') return null

  const doc = published as {status?: string; distributionLog?: unknown[]} | null
  if (!doc || doc.status !== 'published') return null

  const alreadySent = Array.isArray(doc.distributionLog) && doc.distributionLog.length > 0

  return {
    label: isRunning ? 'Sending…' : 'Send Update',
    icon: BellIcon,
    tone: 'caution' as const,
    disabled: isRunning,
    dialog: alreadySent
      ? {
          type: 'confirm' as const,
          message:
            'This announcement was already distributed. Send a correction to all channels?',
          onCancel: props.onComplete,
          onConfirm: onHandle,
        }
      : undefined,
    onHandle: alreadySent ? undefined : onHandle,
  }
}
