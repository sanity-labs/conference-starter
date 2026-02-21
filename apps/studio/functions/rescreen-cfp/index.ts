import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

/**
 * Re-screening function. Triggers when a submission status changes to 'screening'
 * (via the "Re-screen" document action in Studio). Performs the same AI evaluation
 * as screen-cfp but on update rather than create.
 */

interface SubmissionEvent {
  _id: string
  sessionTitle: string
  sessionType: string
  abstract: string
  level: string
  topics: string[]
  submitterName: string
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
    console.log(`[dry-run] rescreen-cfp triggered for submission ${data._id}`)
    console.log(`[dry-run] Would run AI re-evaluation, then set status to "scored"`)
    console.log(`[dry-run] Submission: "${data.sessionTitle}" (${data.sessionType}) by ${data.submitterName}`)

    const {criteria, instruction} = await client.fetch<{criteria: string | null; instruction: string | null}>(
      `{"criteria": *[_type == "conference"][0].scoringCriteria, "instruction": *[_id == "prompt.cfpScreening"][0].instruction}`,
    )
    console.log(`[dry-run] Scoring criteria ${criteria ? `found (${criteria.length} chars)` : 'MISSING — would fail in production'}`)
    console.log(`[dry-run] Prompt document ${instruction ? `found (${instruction.length} chars)` : 'MISSING — run: pnpm tsx scripts/seed-prompts.ts'}`)
    return
  }

  try {
    // Fetch scoring criteria and prompt instruction in a single query
    const {criteria, instruction} = await client.fetch<{criteria: string | null; instruction: string | null}>(
      `{"criteria": *[_type == "conference"][0].scoringCriteria, "instruction": *[_id == "prompt.cfpScreening"][0].instruction}`,
    )

    if (!criteria) {
      throw new Error('No scoring criteria found on conference document')
    }

    if (!instruction) {
      throw new Error(
        'No prompt document found (prompt.cfpScreening). Run: pnpm tsx scripts/seed-prompts.ts',
      )
    }

    // Use Agent Actions generate with noWrite to get AI evaluation
    const result = await client.agent.action.generate({
      schemaId: process.env.SANITY_SCHEMA_ID!,
      documentId: data._id,
      instruction,
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

    // Patch the document with screening results
    await client
      .patch(data._id)
      .set({
        'aiScreening.score': Math.round(Math.min(100, Math.max(0, score))),
        'aiScreening.summary': summary,
        'aiScreening.scoredAt': new Date().toISOString(),
        status: 'scored',
      })
      .commit()

    console.log(`Submission ${data._id} re-scored: ${score}`)
  } catch (error) {
    console.error(`Failed to re-screen submission ${data._id}:`, error)

    // Revert status to submitted on failure
    try {
      await client
        .patch(data._id)
        .set({
          status: 'submitted',
          reviewNotes: `AI re-screening failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
        })
        .commit()
    } catch (revertError) {
      console.error(`Failed to revert submission status:`, revertError)
    }
  }
})
