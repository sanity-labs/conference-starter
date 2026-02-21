import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

interface SubmissionEvent {
  _id: string
  sessionTitle: string
  sessionType: string
  abstract: string
  level: string
  topics: string[]
  submitterName: string
  submitterEmail: string
  bio: string
  status: string
  conference: {_ref: string}
}

export const handler = documentEventHandler<SubmissionEvent>(async ({context, event}) => {
  const {data} = event
  const dryRun = Boolean(context.local)
  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
  })

  if (dryRun) {
    console.log(`[dry-run] screen-cfp triggered for submission ${data._id}`)
    console.log(`[dry-run] Would run AI evaluation, then set status to "scored"`)
    console.log(`[dry-run] Submission: "${data.sessionTitle}" (${data.sessionType}) by ${data.submitterName}`)

    const criteria = await client.fetch<string | null>(
      `*[_type == "conference"][0].scoringCriteria`,
    )
    console.log(`[dry-run] Scoring criteria ${criteria ? `found (${criteria.length} chars)` : 'MISSING — would fail in production'}`)
    return
  }

  try {
    // Fetch scoring criteria from conference document
    const criteria = await client.fetch<string | null>(
      `*[_type == "conference"][0].scoringCriteria`,
    )

    if (!criteria) {
      throw new Error('No scoring criteria found on conference document')
    }

    // Use Agent Actions generate with noWrite to get AI evaluation
    const result = await client.agent.action.generate({
      schemaId: process.env.SANITY_SCHEMA_ID!,
      documentId: data._id,
      instruction: `Evaluate this CFP submission against the conference scoring criteria.

Session title: $title
Session type: $sessionType
Abstract: $abstract
Speaker bio: $bio

Scoring criteria:
$criteria

Rate the submission on a scale of 0 to 100 based on:
- Topic relevance and audience fit
- Speaker expertise (based on bio)
- Abstract quality and clarity
- Session type appropriateness

The score field must be a number between 0 and 100.
Write a brief 2-3 sentence evaluation summary explaining the score.`,
      instructionParams: {
        title: {type: 'field', path: 'sessionTitle'},
        sessionType: {type: 'field', path: 'sessionType'},
        abstract: {type: 'field', path: 'abstract'},
        bio: {type: 'field', path: 'bio'},
        criteria: {
          type: 'constant',
          value: criteria,
        },
      },
      target: {path: 'aiScreening', include: ['score', 'summary']},
      conditionalPaths: {
        defaultReadOnly: false,
      },
      noWrite: true,
    })

    // Extract score and summary from the result
    const doc = result as Record<string, unknown>
    const aiScreening = doc.aiScreening as {score?: number; summary?: string} | undefined
    const score = aiScreening?.score
    const summary = aiScreening?.summary

    if (typeof score !== 'number' || !summary) {
      throw new Error(
        `AI evaluation returned invalid results: score=${score}, summary=${summary ? 'present' : 'missing'}`,
      )
    }

    // Patch the document with screening results — goes directly from submitted → scored
    await client
      .patch(data._id)
      .set({
        'aiScreening.score': Math.round(Math.min(100, Math.max(0, score))),
        'aiScreening.summary': summary,
        'aiScreening.scoredAt': new Date().toISOString(),
        status: 'scored',
      })
      .commit()

    console.log(`Submission ${data._id} scored: ${score}`)
  } catch (error) {
    console.error(`Failed to screen submission ${data._id}:`, error)

    // Leave status as submitted on failure so it can be retried
    try {
      await client
        .patch(data._id)
        .set({
          reviewNotes: `AI screening failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
        })
        .commit()
    } catch (revertError) {
      console.error(`Failed to set review notes:`, revertError)
    }
  }
})
