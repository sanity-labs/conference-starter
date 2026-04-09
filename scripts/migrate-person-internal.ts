/**
 * One-shot migration: move email, telegramId, travelStatus, internalNotes
 * from person documents into personInternal documents.
 *
 * Run from apps/studio/:
 *   cp ../../scripts/migrate-person-internal.ts . && npx sanity exec ./migrate-person-internal.ts --with-user-token && rm migrate-person-internal.ts
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient().withConfig({apiVersion: '2026-04-01'})

interface PersonWithInternal {
  _id: string
  email?: string
  telegramId?: string
  travelStatus?: string
  internalNotes?: string
}

async function migrate() {
  const people = await client.fetch<PersonWithInternal[]>(
    `*[_type == "person" && (defined(email) || defined(telegramId) || defined(travelStatus) || defined(internalNotes))]{
      _id, email, telegramId, travelStatus, internalNotes
    }`,
  )

  if (people.length === 0) {
    console.log('No person documents with internal fields found. Nothing to migrate.')
    return
  }

  console.log(`Found ${people.length} person document(s) with internal fields to migrate.`)

  const transaction = client.transaction()

  for (const person of people) {
    const internalId = `personInternal.${person._id}`

    // Create personInternal doc
    transaction.createIfNotExists({
      _id: internalId,
      _type: 'personInternal',
      person: {_type: 'reference', _ref: person._id, _weak: true},
      ...(person.email && {email: person.email}),
      ...(person.telegramId && {telegramId: person.telegramId}),
      ...(person.travelStatus && {travelStatus: person.travelStatus}),
      ...(person.internalNotes && {internalNotes: person.internalNotes}),
    })

    // Unset the fields from person doc
    transaction.patch(person._id, (patch) =>
      patch.unset(['email', 'telegramId', 'travelStatus', 'internalNotes']),
    )

    console.log(`  ${person._id} → ${internalId}`)
  }

  await transaction.commit()
  console.log(`\nMigration complete. ${people.length} personInternal doc(s) created.`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
