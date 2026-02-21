import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {ResetIcon} from '@sanity/icons'

export const rescreenSubmission: DocumentActionComponent = (props) => {
  const {id, type, published, draft} = props
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2025-11-01'})
  const doc = (draft || published) as Record<string, unknown> | null

  if (type !== 'submission') return null

  const status = doc?.status as string | undefined
  if (!status || !['scored', 'in-review', 'submitted'].includes(status)) return null

  return {
    label: isRunning ? 'Re-screening...' : 'Re-screen',
    icon: ResetIcon,
    disabled: isRunning,
    onHandle: async () => {
      setIsRunning(true)

      try {
        // Clear existing screening data and set status to 'screening'
        // This triggers the rescreen-cfp function (filter matches status == "screening")
        await client
          .patch(id)
          .set({
            status: 'screening',
            'aiScreening.score': undefined,
            'aiScreening.summary': undefined,
            'aiScreening.scoredAt': undefined,
          })
          .unset(['aiScreening.score', 'aiScreening.summary', 'aiScreening.scoredAt'])
          .commit()

        console.log(`Submission ${id} sent for re-screening`)
        props.onComplete()
      } catch (error) {
        console.error('Failed to re-screen submission:', error)
      } finally {
        setIsRunning(false)
      }
    },
  }
}
