import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {CheckmarkCircleIcon} from '@sanity/icons'

export const acceptSubmission: DocumentActionComponent = (props) => {
  const {id, type, published, draft, onComplete} = props
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2025-11-01'})
  const doc = (draft || published) as Record<string, unknown> | null

  if (type !== 'submission') return null

  const status = doc?.status as string | undefined
  if (!status || !['scored', 'in-review'].includes(status)) return null

  return {
    label: isRunning ? 'Accepting...' : 'Accept Submission',
    icon: CheckmarkCircleIcon,
    tone: 'positive' as const,
    disabled: isRunning,
    onHandle: async () => {
      setIsRunning(true)

      try {
        const submitterName = (doc?.submitterName as string) || ''
        const sessionTitle = (doc?.sessionTitle as string) || ''
        const sessionType = (doc?.sessionType as string) || 'talk'
        const abstract = (doc?.abstract as string) || ''
        const bio = (doc?.bio as string) || ''
        const company = (doc?.company as string) || undefined
        const level = (doc?.level as string) || undefined
        const submitterEmail = (doc?.submitterEmail as string) || ''

        // Derive duration from session type
        const durationMap: Record<string, number> = {
          talk: 30,
          lightning: 10,
          panel: 45,
          workshop: 120,
          keynote: 45,
        }
        const duration = durationMap[sessionType] || 30

        // Create speaker document
        const speaker = await client.create({
          _type: 'speaker',
          name: submitterName,
          slug: {_type: 'slug', current: slugify(submitterName)},
          role: company ? `Speaker at ${company}` : 'Speaker',
          company,
          bio: [
            {
              _type: 'block',
              _key: 'bio-block',
              style: 'normal',
              markDefs: [],
              children: [{_type: 'span', _key: 'bio-span', text: bio, marks: []}],
            },
          ],
          travelStatus: 'not-started',
          internalNotes: `Created from CFP submission. Email: ${submitterEmail}`,
        })

        // Create session document
        const session = await client.create({
          _type: 'session',
          title: sessionTitle,
          slug: {_type: 'slug', current: slugify(sessionTitle)},
          sessionType,
          abstract: [
            {
              _type: 'block',
              _key: 'abstract-block',
              style: 'normal',
              markDefs: [],
              children: [{_type: 'span', _key: 'abstract-span', text: abstract, marks: []}],
            },
          ],
          level,
          duration,
          speakers: [{_type: 'reference', _ref: speaker._id, _key: `speaker-${speaker._id}`}],
        })

        // Update submission status
        await client.patch(id).set({status: 'accepted'}).commit()

        props.onComplete()

        // Show toast with link to new session (using alert as fallback)
        console.log(
          `Submission accepted. Speaker: ${speaker._id}, Session: ${session._id}`,
        )
      } catch (error) {
        console.error('Failed to accept submission:', error)
      } finally {
        setIsRunning(false)
      }
    },
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
