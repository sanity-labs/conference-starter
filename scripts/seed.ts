/**
 * Seed script — transforms 2025 export data and creates new conference documents.
 *
 * Usage: pnpm tsx scripts/seed.ts
 *
 * Requires SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET env vars, or
 * reads from apps/studio/.env.local.
 */

import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local from studio
const envPath = resolve(__dirname, '../apps/studio/.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=(.*)$/)
  if (match) env[match[1]] = match[2]
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  console.error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_STUDIO_DATASET')
  process.exit(1)
}

const token = process.env.SANITY_API_TOKEN || env.SANITY_API_TOKEN
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
})

// ─── Person → Speaker mapping ────────────────────────────────────────────

interface PersonDoc {
  _id: string
  name: string
  company?: string
  title?: string
  image?: {_type: string; _sanityAsset?: string; asset?: {_ref: string}}
  bio?: unknown[]
}

// Read the ndjson export to get person documents
function readPersonsFromExport(): PersonDoc[] {
  const ndjsonPath = resolve(__dirname, '../production-export-data.ndjson')
  try {
    const lines = readFileSync(ndjsonPath, 'utf-8').split('\n').filter(Boolean)
    return lines
      .map((line) => JSON.parse(line))
      .filter((doc: {_type: string}) => doc._type === 'person')
  } catch {
    console.log('No local export found — will fetch persons from dataset if available')
    return []
  }
}

// ─── Seed data ───────────────────────────────────────────────────────────

const CONFERENCE_ID = 'conference'

const tracks = [
  {
    _id: 'track-frontend',
    name: 'Frontend',
    slug: {_type: 'slug' as const, current: 'frontend'},
    description: 'Modern web development, frameworks, and UI engineering.',
    order: 1,
  },
  {
    _id: 'track-ai',
    name: 'AI & Content',
    slug: {_type: 'slug' as const, current: 'ai-content'},
    description: 'AI-powered content operations, agents, and intelligent search.',
    order: 2,
  },
  {
    _id: 'track-platform',
    name: 'Platform',
    slug: {_type: 'slug' as const, current: 'platform'},
    description: 'Content infrastructure, APIs, and developer experience.',
    order: 3,
  },
]

const venue = {
  _id: 'venue-main',
  name: 'The Glasshouse',
  slug: {_type: 'slug' as const, current: 'the-glasshouse'},
  address: '660 12th Ave, New York, NY 10019',
  mapUrl: 'https://maps.google.com/?q=The+Glasshouse+NYC',
}

const rooms = [
  {
    _id: 'room-main-hall',
    name: 'Main Hall',
    slug: {_type: 'slug' as const, current: 'main-hall'},
    venue: {_type: 'reference' as const, _ref: 'venue-main'},
    capacity: 500,
    floor: 'Ground Floor',
    order: 1,
  },
  {
    _id: 'room-workshop-a',
    name: 'Workshop Room A',
    slug: {_type: 'slug' as const, current: 'workshop-room-a'},
    venue: {_type: 'reference' as const, _ref: 'venue-main'},
    capacity: 40,
    floor: '2nd Floor',
    order: 2,
  },
  {
    _id: 'room-workshop-b',
    name: 'Workshop Room B',
    slug: {_type: 'slug' as const, current: 'workshop-room-b'},
    venue: {_type: 'reference' as const, _ref: 'venue-main'},
    capacity: 40,
    floor: '2nd Floor',
    order: 3,
  },
]

async function seed() {
  console.log(`Seeding ${projectId}/${dataset}...\n`)

  const transaction = client.transaction()

  // 1. Conference singleton
  console.log('Creating conference...')
  transaction.createOrReplace({
    _id: CONFERENCE_ID,
    _type: 'conference',
    name: 'Everything NYC 2026',
    slug: {_type: 'slug', current: 'everything-nyc-2026'},
    tagline: 'Build digital experiences that move people forward.',
    description:
      'Where developers and creative thinkers come together to explore what it means to build digital experiences that move people, and the world, forward. From content operations to cultural impact.',
    startDate: '2026-10-15T09:00:00-04:00',
    endDate: '2026-10-16T18:00:00-04:00',
    venue: {_type: 'reference', _ref: 'venue-main'},
    tracks: tracks.map((t) => ({_type: 'reference', _ref: t._id, _key: t._id})),
  })

  // 2. Tracks
  console.log('Creating tracks...')
  for (const t of tracks) {
    transaction.createOrReplace({...t, _type: 'track'})
  }

  // 3. Venue
  console.log('Creating venue...')
  transaction.createOrReplace({...venue, _type: 'venue'})

  // 4. Rooms
  console.log('Creating rooms...')
  for (const r of rooms) {
    transaction.createOrReplace({...r, _type: 'room'})
  }

  // 5. People — fetch existing persons from dataset or from export
  console.log('Fetching existing person documents...')
  const existingPersons = await client.fetch<PersonDoc[]>(
    `*[_type == "person"]{ _id, name, company, title, image, bio }`,
  )

  const persons = existingPersons.length > 0 ? existingPersons : readPersonsFromExport()
  console.log(`Found ${persons.length} person documents to transform into people`)

  const speakerIds: string[] = []
  for (const person of persons) {
    // Skip the generic "Workshop participants" entry
    if (person.name === 'Workshop participants') continue

    const speakerId = `person-${person._id}`
    speakerIds.push(speakerId)

    // Map person fields to person schema
    const speakerDoc: Record<string, unknown> = {
      _id: speakerId,
      _type: 'person',
      name: person.name,
      slug: {
        _type: 'slug',
        current: person.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      },
      role: person.title || extractRole(person.company),
      company: extractCompany(person.company),
      travelStatus: 'not-started',
    }

    // Preserve existing image asset reference if present
    if (person.image?.asset?._ref) {
      speakerDoc.photo = {
        _type: 'image',
        asset: {_type: 'reference', _ref: person.image.asset._ref},
      }
    }

    // Preserve bio if it exists
    if (person.bio && Array.isArray(person.bio) && person.bio.length > 0) {
      speakerDoc.bio = person.bio
    }

    transaction.createOrReplace(speakerDoc)
  }

  // 6. Sample sessions using real speakers
  console.log('Creating sample sessions...')
  const sessions = buildSessions(speakerIds)
  for (const s of sessions) {
    transaction.createOrReplace(s)
  }

  // 7. Schedule slots
  console.log('Creating schedule slots...')
  const slots = buildScheduleSlots(sessions)
  for (const slot of slots) {
    transaction.createOrReplace(slot)
  }

  // Commit
  console.log('\nCommitting transaction...')
  const result = await transaction.commit()
  console.log(`Done! ${result.documentIds.length} documents created/updated.`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function extractCompany(raw?: string): string {
  if (!raw) return ''
  // Handle patterns like "Complex [CTO]" or "OpenAI + Netlify [thinker & coder]"
  return raw.replace(/\s*\[.*?\]\s*$/, '').trim()
}

function extractRole(raw?: string): string {
  if (!raw) return 'Speaker'
  const match = raw.match(/\[(.*?)\]/)
  return match ? match[1] : 'Speaker'
}

interface SessionDoc {
  _id: string
  _type: string
  title: string
  slug: {_type: string; current: string}
  sessionType: string
  duration: number
  level?: string
  track?: {_type: string; _ref: string}
  speakers?: Array<{_type: string; _ref: string; _key: string}>
  abstract?: Array<Record<string, unknown>>
}

function buildSessions(speakerIds: string[]): SessionDoc[] {
  const sessions: SessionDoc[] = []

  // Opening keynote
  sessions.push({
    _id: 'session-opening-keynote',
    _type: 'session',
    title: 'Opening Keynote: The Future of Digital Experiences',
    slug: {_type: 'slug', current: 'opening-keynote'},
    sessionType: 'keynote',
    duration: 45,
    level: 'beginner',
    track: {_type: 'reference', _ref: 'track-frontend'},
    speakers: speakerIds.slice(0, 1).map((id) => ({_type: 'reference', _ref: id, _key: id})),
    abstract: [
      {
        _type: 'block',
        _key: 'abs-ok-1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'abs-ok-1s',
            marks: [],
            text: 'A tour of where the web is heading and how content-driven development is reshaping the way we build.',
          },
        ],
      },
    ],
  })

  // Talks using available speakers
  const talkTopics = [
    {title: 'Content-Driven Architecture at Scale', track: 'track-platform', level: 'advanced'},
    {title: 'Visual Editing: From Stega to Studio', track: 'track-frontend', level: 'intermediate'},
    {title: 'AI Agents for Content Operations', track: 'track-ai', level: 'intermediate'},
    {title: 'GROQ Deep Dive: Query Patterns That Scale', track: 'track-platform', level: 'advanced'},
    {title: 'Building Accessible Conference Websites', track: 'track-frontend', level: 'beginner'},
    {title: 'Semantic Search and Content Discovery', track: 'track-ai', level: 'intermediate'},
  ]

  for (let i = 0; i < talkTopics.length; i++) {
    const topic = talkTopics[i]
    const speakerIndex = (i + 1) % speakerIds.length
    const slug = topic.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    sessions.push({
      _id: `session-talk-${i + 1}`,
      _type: 'session',
      title: topic.title,
      slug: {_type: 'slug', current: slug},
      sessionType: 'talk',
      duration: 30,
      level: topic.level,
      track: {_type: 'reference', _ref: topic.track},
      speakers: [
        {_type: 'reference', _ref: speakerIds[speakerIndex], _key: speakerIds[speakerIndex]},
      ],
      abstract: [
        {
          _type: 'block',
          _key: `abs-t${i + 1}-1`,
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: `abs-t${i + 1}-1s`,
              marks: [],
              text: `An exploration of ${topic.title.toLowerCase()} and what it means for modern web development.`,
            },
          ],
        },
      ],
    })
  }

  // Breaks
  sessions.push({
    _id: 'session-lunch',
    _type: 'session',
    title: 'Lunch Break',
    slug: {_type: 'slug', current: 'lunch-break'},
    sessionType: 'break',
    duration: 60,
  })

  sessions.push({
    _id: 'session-coffee',
    _type: 'session',
    title: 'Coffee Break',
    slug: {_type: 'slug', current: 'coffee-break'},
    sessionType: 'break',
    duration: 20,
  })

  return sessions
}

function buildScheduleSlots(sessions: SessionDoc[]) {
  // Day 1: Oct 15, 2026
  const day1 = '2026-10-15'
  const slots: Array<Record<string, unknown>> = []

  const schedule = [
    {sessionId: 'session-opening-keynote', start: '09:00', room: 'room-main-hall', plenary: true},
    {sessionId: 'session-talk-1', start: '10:00', room: 'room-main-hall'},
    {sessionId: 'session-talk-2', start: '10:00', room: 'room-workshop-a'},
    {sessionId: 'session-talk-3', start: '10:00', room: 'room-workshop-b'},
    {sessionId: 'session-coffee', start: '10:30', room: 'room-main-hall', plenary: true},
    {sessionId: 'session-talk-4', start: '11:00', room: 'room-main-hall'},
    {sessionId: 'session-talk-5', start: '11:00', room: 'room-workshop-a'},
    {sessionId: 'session-talk-6', start: '11:00', room: 'room-workshop-b'},
    {sessionId: 'session-lunch', start: '12:00', room: 'room-main-hall', plenary: true},
  ]

  for (const entry of schedule) {
    const session = sessions.find((s) => s._id === entry.sessionId)
    if (!session) continue

    const startTime = `${day1}T${entry.start}:00-04:00`
    const endMinutes =
      parseInt(entry.start.split(':')[0]) * 60 +
      parseInt(entry.start.split(':')[1]) +
      session.duration
    const endHour = Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')
    const endMin = (endMinutes % 60).toString().padStart(2, '0')
    const endTime = `${day1}T${endHour}:${endMin}:00-04:00`

    slots.push({
      _id: `slot-${entry.sessionId}-${entry.room}`,
      _type: 'scheduleSlot',
      session: {_type: 'reference', _ref: entry.sessionId},
      conference: {_type: 'reference', _ref: CONFERENCE_ID},
      startTime,
      endTime,
      room: {_type: 'reference', _ref: entry.room},
      isPlenary: entry.plenary || false,
    })
  }

  return slots
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
