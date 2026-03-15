/**
 * Migration script — renames _type from "speaker" to "person" on existing documents.
 *
 * Usage: pnpm tsx scripts/migrate-speaker-to-person.ts
 *
 * Since _type is immutable in Sanity, this script:
 * 1. Creates new person documents (speaker-{uuid} → person-{uuid})
 * 2. Updates all references pointing to old speaker IDs
 * 3. Deletes old speaker documents
 * All in a single transaction for atomicity.
 */

import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// web env has permanent API tokens (sk*), bot env may have session tokens (skzn*)
const envFiles = [
  resolve(__dirname, '../apps/web/.env.local'),
  resolve(__dirname, '../apps/studio/.env.local'),
  resolve(__dirname, '../apps/bot/.env'),
]
const env: Record<string, string> = {}
for (const envPath of envFiles) {
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const match = line.match(/^(\w+)=(.*)$/)
      if (match && !env[match[1]]) env[match[1]] = match[2]
    }
  } catch {
    // file may not exist
  }
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  console.error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_STUDIO_DATASET')
  process.exit(1)
}

const token =
  process.env.SANITY_API_TOKEN || env.SANITY_API_WRITE_TOKEN || env.SANITY_API_TOKEN
if (!token) {
  console.error(
    'Missing SANITY_API_TOKEN — add a token with write access to apps/studio/.env.local',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-03-15',
  token,
  useCdn: false,
  perspective: 'raw', // include both published and draft documents
})

console.log(`Using project: ${projectId}, dataset: ${dataset}`)
console.log(`Token prefix: ${token.slice(0, 4)}...`)

function newId(oldId: string): string {
  // speaker-{uuid} → person-{uuid}
  return oldId.replace(/^speaker-/, 'person-')
}

async function migrate() {
  // 1. Fetch all speaker documents
  const speakers = await client.fetch<Array<Record<string, unknown>>>(
    '*[_type == "speaker"]{ ... }',
  )

  if (speakers.length === 0) {
    console.log('No speaker documents found — migration already complete.')
    return
  }

  console.log(`Found ${speakers.length} speaker document(s) to migrate:`)
  for (const doc of speakers) {
    console.log(`  - ${doc._id} → ${newId(doc._id as string)} (${doc.name || 'unnamed'})`)
  }

  // Build ID mapping
  const idMap = new Map<string, string>()
  for (const doc of speakers) {
    idMap.set(doc._id as string, newId(doc._id as string))
  }

  // 2. Find all documents (published + drafts) that reference any speaker ID
  //    Use individual ID checks to catch both published and draft versions
  const speakerIds = [...idMap.keys()]
  const referencingDocs = await client.fetch<Array<Record<string, unknown>>>(
    `*[!(_type == "speaker") && references($ids)]{ ... }`,
    {ids: speakerIds},
  )

  console.log(`\nFound ${referencingDocs.length} document(s) with references to update`)

  // 3. Build transaction
  const tx = client.transaction()

  // 3a. Create new person documents
  for (const doc of speakers) {
    const {_type, _rev, _id, ...rest} = doc
    const personId = newId(_id as string)
    tx.createOrReplace({
      ...rest,
      _id: personId,
      _type: 'person',
    } as Record<string, unknown> & {_id: string; _type: string})
  }

  // 3b. Update references in all referencing documents
  for (const doc of referencingDocs) {
    const docId = doc._id as string
    const serialized = JSON.stringify(doc)

    // Replace all old speaker IDs with new person IDs in the serialized doc
    let updated = serialized
    for (const [oldId, newPersonId] of idMap) {
      updated = updated.replaceAll(`"${oldId}"`, `"${newPersonId}"`)
    }

    if (updated !== serialized) {
      const updatedDoc = JSON.parse(updated) as Record<string, unknown>
      const {_rev, ...rest} = updatedDoc
      tx.createOrReplace(rest as Record<string, unknown> & {_id: string; _type: string})
      console.log(`  Updating refs in: ${docId} (${doc._type})`)
    }
  }

  // 3c. Delete old speaker documents (now safe — refs point to new person IDs)
  for (const [oldId] of idMap) {
    tx.delete(oldId)
  }

  console.log('\nCommitting transaction...')
  const result = await tx.commit()
  console.log(`Migration complete — ${speakers.length} document(s) migrated.`)
  console.log(`Transaction ID: ${result.transactionId}`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
