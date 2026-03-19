/**
 * Seed script — creates all ContentOps Conf documents.
 *
 * Usage (from apps/studio/ — script must be local for --with-user-token to inject):
 *   cp ../../scripts/seed.ts . && npx sanity exec ./seed.ts --with-user-token && rm seed.ts
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-03-15'})

// ─── Helpers ─────────────────────────────────────────────────────────────

function slug(value: string) {
  return {
    _type: 'slug' as const,
    current: value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
  }
}

function ref(id: string) {
  return {_type: 'reference' as const, _ref: id}
}

function keyedRef(id: string) {
  return {_type: 'reference' as const, _ref: id, _key: id}
}

function textBlock(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-s`, marks: [], text}],
  }
}

// ─── Tracks ──────────────────────────────────────────────────────────────

const tracks = [
  {
    _id: 'track-structure',
    _type: 'track',
    name: 'Structure That Scales',
    slug: slug('structure-that-scales'),
    description:
      'Structured content modeling, GROQ queries, type-safe schemas — the foundation of a content operating system.',
    order: 1,
  },
  {
    _id: 'track-ai',
    _type: 'track',
    name: 'AI That Works',
    slug: slug('ai-that-works'),
    description:
      'CFP screening, agent-powered bots, AI concierges — AI that enhances content operations without replacing human judgment.',
    order: 2,
  },
  {
    _id: 'track-build',
    _type: 'track',
    name: 'Build Without Limits',
    slug: slug('build-without-limits'),
    description:
      'Monorepos, edge rendering, visual editing, email pipelines — the engineering patterns that make content infrastructure real.',
    order: 3,
  },
]

// ─── Venue & Rooms ───────────────────────────────────────────────────────

const venue = {
  _id: 'venue-main',
  _type: 'venue',
  name: 'The Glasshouse',
  slug: slug('the-glasshouse'),
  address: '660 12th Ave, New York, NY 10019',
  mapUrl: 'https://maps.google.com/?q=The+Glasshouse+NYC',
}

const rooms = [
  {
    _id: 'room-content-lake',
    _type: 'room',
    name: 'The Content Lake',
    slug: slug('the-content-lake'),
    venue: ref('venue-main'),
    capacity: 500,
    floor: 'Ground Floor',
    order: 1,
  },
  {
    _id: 'room-schema-lab',
    _type: 'room',
    name: 'The Schema Lab',
    slug: slug('the-schema-lab'),
    venue: ref('venue-main'),
    capacity: 40,
    floor: '2nd Floor',
    order: 2,
  },
  {
    _id: 'room-query-engine',
    _type: 'room',
    name: 'The Query Engine',
    slug: slug('the-query-engine'),
    venue: ref('venue-main'),
    capacity: 40,
    floor: '2nd Floor',
    order: 3,
  },
]

// ─── People ──────────────────────────────────────────────────────────────

const people = [
  // Real Sanity people
  {
    _id: 'person-knut',
    name: 'Knut Melvær',
    role: 'Head of Developer Education',
    company: 'Sanity',
    bio: 'Knut leads developer education at Sanity, helping developers understand the power of structured content. He has spent years building content platforms, writing documentation, and speaking at conferences about content operations. When not coding, he is probably thinking about how to make developer experiences better.',
  },
  {
    _id: 'person-simen',
    name: 'Simen Svale Skogsrud',
    role: 'Co-Founder & CTO',
    company: 'Sanity',
    bio: 'Simen co-founded Sanity and leads its technical direction. He designed GROQ, the Content Lake, and the real-time collaboration architecture. Before Sanity, he spent a decade building content infrastructure for media companies. He believes structured content is the foundation of every great digital experience.',
  },
  {
    _id: 'person-espen',
    name: 'Espen Hovlandsdal',
    role: 'Senior Developer',
    company: 'Sanity',
    bio: 'Espen is a senior developer at Sanity working on the core platform. He maintains several open-source libraries in the Sanity ecosystem and is passionate about developer tooling, query languages, and making complex systems feel simple.',
  },
  {
    _id: 'person-magnus',
    name: 'Magnus Hillestad',
    role: 'Developer',
    company: 'Sanity',
    bio: 'Magnus works on Sanity Studio and visual editing tools. He focuses on the intersection of real-time collaboration and content authoring, building tools that let editors see their changes instantly in the context of the live site.',
  },
  {
    _id: 'person-evelina',
    name: 'Evelina Wahlström',
    role: 'Developer',
    company: 'Sanity',
    bio: 'Evelina is a developer at Sanity working on AI integrations and content automation. She builds the tools that connect structured content to language models, from agent-powered bots to automated content workflows.',
  },
  // Fictional speakers
  {
    _id: 'person-amara',
    name: 'Amara Osei',
    role: 'VP of Engineering',
    company: 'Meridian Health',
    bio: 'Amara leads engineering at Meridian Health, where she oversees the platform that serves health content to 50 million patients. She has spent her career building content systems that must be accurate, accessible, and fast. She is a vocal advocate for structured content as a reliability strategy.',
  },
  {
    _id: 'person-james',
    name: 'James Whitfield',
    role: 'Lead Frontend Engineer',
    company: 'Canopy Commerce',
    bio: 'James leads the frontend team at Canopy Commerce, building storefronts that serve product content to millions of shoppers. He specializes in performance optimization, edge rendering, and the cache patterns that make content-heavy sites fast.',
  },
  {
    _id: 'person-priya',
    name: 'Priya Ramachandran',
    role: 'Product Manager',
    company: 'Atlas Media Group',
    bio: 'Priya manages content products at Atlas Media Group, coordinating between editorial, engineering, and marketing teams. She brings a product perspective to content operations, focusing on how structured content reduces coordination overhead and enables teams to ship faster.',
  },
  {
    _id: 'person-david',
    name: 'David Chen',
    role: 'Staff Software Engineer',
    company: 'Open source contributor',
    bio: 'David is a staff engineer and prolific open-source contributor. He maintains several popular developer tools and has deep experience with monorepo architecture, build systems, and developer experience. He believes great tooling should be invisible.',
  },
  {
    _id: 'person-sofia',
    name: 'Sofia Morales',
    role: 'Engineering Manager',
    company: 'Lighthouse Education',
    bio: 'Sofia manages the engineering team at Lighthouse Education, where structured content powers learning experiences across 200 institutional sites. She focuses on how content architecture decisions at the platform level create leverage for every team downstream.',
  },
]

// ─── Sessions ────────────────────────────────────────────────────────────

interface SessionDef {
  _id: string
  title: string
  sessionType: string
  duration: number
  level?: string
  track?: string
  speakers?: string[]
  abstract: string
}

const sessions: SessionDef[] = [
  // Day 1
  {
    _id: 'session-opening-keynote',
    title: 'Opening Keynote: Content Is Infrastructure',
    sessionType: 'keynote',
    duration: 45,
    level: 'beginner',
    track: 'track-structure',
    speakers: ['person-simen'],
    abstract:
      'Content is no longer something you pour into templates. It is infrastructure — the shared foundation that drives websites, emails, AI agents, and automation. This keynote explores what it means to treat content as a first-class engineering concern and how structured content changes the economics of building digital experiences.',
  },
  {
    _id: 'session-schema-driven',
    title: 'Schema-Driven Development: The 10-Type Content Model',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-structure',
    speakers: ['person-knut'],
    abstract:
      'A deep dive into the content model behind this conference starter — 10 document types that power an entire event platform. Learn how schema design decisions cascade through queries, APIs, and frontend components, and why getting the model right matters more than getting it fast.',
  },
  {
    _id: 'session-ai-screening',
    title: 'AI Screening at Scale: From 500 CFPs to 50 Talks',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-ai',
    speakers: ['person-amara'],
    abstract:
      'How we built an AI-assisted CFP screening pipeline that evaluates hundreds of submissions against configurable criteria. The prompts are stored as content, the scores feed back into the Content Lake, and human reviewers always have the final say. AI enhances — it does not replace.',
  },
  {
    _id: 'session-cache-pattern',
    title: 'The Three-Layer Cache Pattern for Next.js 16',
    sessionType: 'talk',
    duration: 30,
    level: 'advanced',
    track: 'track-build',
    speakers: ['person-james'],
    abstract:
      'Next.js 16 introduced cache components with the "use cache" directive. This talk walks through the three-layer pattern — sync page, dynamic layer, cached component — that makes structured content both fast and fresh. Includes real performance numbers and gotchas we hit in production.',
  },
  {
    _id: 'session-coffee-1',
    title: 'Coffee Break',
    sessionType: 'break',
    duration: 20,
    abstract: '',
  },
  {
    _id: 'session-groq',
    title: 'GROQ: The Query Language Your Content Deserves',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-structure',
    speakers: ['person-espen'],
    abstract:
      'GROQ was designed for content, not for tables. This talk covers the query patterns that make structured content queryable at any scale — joins through references, projections that reshape data, and the scoring operators that power search. Includes performance tips and common anti-patterns.',
  },
  {
    _id: 'session-visual-editing',
    title: 'Visual Editing: Stega by Default',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-build',
    speakers: ['person-magnus'],
    abstract:
      'Visual editing used to require painstaking manual wiring. Stega changes that — by encoding edit intents directly into content strings, 80% of visual editing works automatically. This talk covers how stega works under the hood, when to use createDataAttribute for the other 20%, and the architecture that makes click-to-edit feel instant.',
  },
  {
    _id: 'session-emails',
    title: 'Ship Emails Without Leaving Your CMS',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-build',
    speakers: ['person-knut'],
    abstract:
      'This conference sends emails — confirmations, acceptances, rejections, welcome packets — all driven by content in the Content Lake. Editors write email templates with variable interpolation in Studio, Sanity Functions render them with React Email, and Resend delivers them. No email service dashboard required.',
  },
  {
    _id: 'session-lunch-1',
    title: 'Lunch',
    sessionType: 'break',
    duration: 60,
    abstract: '',
  },
  // Day 2
  {
    _id: 'session-monorepo',
    title: 'Monorepo Mastery: Turborepo, pnpm, and Separation',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-build',
    speakers: ['person-david'],
    abstract:
      'A content operating system has many moving parts — Studio, website, functions, shared packages. This talk covers how Turborepo and pnpm workspace architecture keep everything fast and separated. Learn about task graphs, remote caching, and the package boundaries that prevent spaghetti.',
  },
  {
    _id: 'session-content-agents',
    title: 'Content Agents: From Ops Bot to Attendee Concierge',
    sessionType: 'talk',
    duration: 30,
    level: 'intermediate',
    track: 'track-ai',
    speakers: ['person-evelina', 'person-knut'],
    abstract:
      'Two bots, two architectures, one Content Lake. The ops bot gives organizers full read-write access through natural language. The attendee concierge answers questions about the schedule, speakers, and venue. This talk compares the Content Agent and Agent Context approaches and when to use each.',
  },
  {
    _id: 'session-structured-at-scale',
    title: 'Structured Content at 200 Sites',
    sessionType: 'talk',
    duration: 30,
    level: 'advanced',
    track: 'track-structure',
    speakers: ['person-sofia'],
    abstract:
      'Lighthouse Education runs 200 institutional sites from a single content platform. This talk shares the content architecture patterns that create leverage — how schema decisions at the platform level multiply across every site, and why governance and flexibility are not opposites.',
  },
  {
    _id: 'session-pm-guide',
    title: "The PM's Guide to Content Operations",
    sessionType: 'talk',
    duration: 30,
    level: 'beginner',
    track: 'track-structure',
    speakers: ['person-priya'],
    abstract:
      'Content operations is not just a developer concern. This talk is for product managers who want to understand what structured content makes possible — how it reduces coordination overhead, enables multi-channel publishing, and turns content from a bottleneck into a competitive advantage.',
  },
  {
    _id: 'session-coffee-2',
    title: 'Coffee Break',
    sessionType: 'break',
    duration: 20,
    abstract: '',
  },
  {
    _id: 'session-panel',
    title: 'Panel: The Architecture of Content',
    sessionType: 'panel',
    duration: 45,
    level: 'intermediate',
    track: 'track-build',
    speakers: ['person-amara', 'person-james', 'person-priya', 'person-espen'],
    abstract:
      'A cross-functional panel bringing together engineering leadership, frontend development, and product management perspectives on content architecture. How do you choose between coupling and flexibility? When does structured content create more work instead of less? What does the future of content infrastructure look like?',
  },
  {
    _id: 'session-closing-keynote',
    title: 'Closing Keynote: The Content Operating System for the AI Era',
    sessionType: 'keynote',
    duration: 45,
    level: 'beginner',
    track: 'track-ai',
    speakers: ['person-simen'],
    abstract:
      'AI does not replace structured content — it amplifies it. When your content is structured, typed, and queryable, AI can screen proposals, power chatbots, generate summaries, and automate workflows. This closing keynote looks at how the Content Lake becomes the shared substrate for both human and machine intelligence.',
  },
  {
    _id: 'session-lunch-2',
    title: 'Lunch',
    sessionType: 'break',
    duration: 60,
    abstract: '',
  },
]

// ─── Schedule ────────────────────────────────────────────────────────────

interface SlotDef {
  sessionId: string
  day: string
  start: string
  room: string
  isPlenary?: boolean
}

const schedule: SlotDef[] = [
  // Day 1 — Oct 15
  {sessionId: 'session-opening-keynote', day: '2026-10-15', start: '09:00', room: 'room-content-lake', isPlenary: true},
  {sessionId: 'session-schema-driven', day: '2026-10-15', start: '10:00', room: 'room-content-lake'},
  {sessionId: 'session-ai-screening', day: '2026-10-15', start: '10:00', room: 'room-schema-lab'},
  {sessionId: 'session-cache-pattern', day: '2026-10-15', start: '10:00', room: 'room-query-engine'},
  {sessionId: 'session-coffee-1', day: '2026-10-15', start: '10:30', room: 'room-content-lake', isPlenary: true},
  {sessionId: 'session-groq', day: '2026-10-15', start: '11:00', room: 'room-content-lake'},
  {sessionId: 'session-visual-editing', day: '2026-10-15', start: '11:00', room: 'room-schema-lab'},
  {sessionId: 'session-emails', day: '2026-10-15', start: '11:00', room: 'room-query-engine'},
  {sessionId: 'session-lunch-1', day: '2026-10-15', start: '12:00', room: 'room-content-lake', isPlenary: true},
  // Day 2 — Oct 16
  {sessionId: 'session-monorepo', day: '2026-10-16', start: '09:00', room: 'room-content-lake'},
  {sessionId: 'session-content-agents', day: '2026-10-16', start: '09:00', room: 'room-schema-lab'},
  {sessionId: 'session-structured-at-scale', day: '2026-10-16', start: '09:30', room: 'room-content-lake'},
  {sessionId: 'session-pm-guide', day: '2026-10-16', start: '09:30', room: 'room-schema-lab'},
  {sessionId: 'session-coffee-2', day: '2026-10-16', start: '10:00', room: 'room-content-lake', isPlenary: true},
  {sessionId: 'session-panel', day: '2026-10-16', start: '10:30', room: 'room-content-lake', isPlenary: true},
  {sessionId: 'session-closing-keynote', day: '2026-10-16', start: '11:15', room: 'room-content-lake', isPlenary: true},
  {sessionId: 'session-lunch-2', day: '2026-10-16', start: '12:00', room: 'room-content-lake', isPlenary: true},
]

// ─── Sponsors ────────────────────────────────────────────────────────────

const sponsors = [
  {
    _id: 'sponsor-sanity',
    name: 'Sanity',
    tier: 'platinum',
    website: 'https://www.sanity.io',
    description:
      'The Content Operating System. Provides the Content Lake, Studio, GROQ, and the structured content foundation that powers this entire platform.',
    order: 1,
  },
  {
    _id: 'sponsor-vercel',
    name: 'Vercel',
    tier: 'gold',
    website: 'https://vercel.com',
    description:
      'The frontend cloud. Deployment platform and edge network behind the starter — preview deployments, serverless functions, and global CDN.',
    order: 1,
  },
  {
    _id: 'sponsor-nextjs',
    name: 'Next.js',
    tier: 'gold',
    website: 'https://nextjs.org',
    description:
      'The React framework. App Router, cache components, and server components power the frontend of this conference platform.',
    order: 2,
  },
  {
    _id: 'sponsor-resend',
    name: 'Resend',
    tier: 'silver',
    website: 'https://resend.com',
    description:
      'Email for developers. Powers the email pipeline with reliable delivery and tracking — every CFP confirmation, acceptance, and speaker welcome.',
    order: 1,
  },
  {
    _id: 'sponsor-turborepo',
    name: 'Turborepo',
    tier: 'silver',
    website: 'https://turbo.build',
    description:
      'Monorepo build system. Task graph and caching make the multi-app starter build fast across Studio, website, and shared packages.',
    order: 2,
  },
  {
    _id: 'sponsor-react-email',
    name: 'React Email',
    tier: 'bronze',
    website: 'https://react.email',
    description:
      'React components for email. Generates the responsive HTML layouts for email templates that editors manage in Studio.',
    order: 1,
  },
  {
    _id: 'sponsor-pnpm',
    name: 'pnpm',
    tier: 'community',
    website: 'https://pnpm.io',
    description:
      'Fast, disk-efficient package manager. Workspace support and strict dependency resolution keep the monorepo clean.',
    order: 1,
  },
  {
    _id: 'sponsor-typescript',
    name: 'TypeScript',
    tier: 'community',
    website: 'https://www.typescriptlang.org',
    description:
      'Type safety end-to-end. Powered by Sanity TypeGen — from schema definition to GROQ query result to frontend component prop.',
    order: 2,
  },
]

// ─── Seed ────────────────────────────────────────────────────────────────

async function seed() {
  const {projectId, dataset} = client.config()
  console.log(`Seeding ${projectId}/${dataset}...\n`)

  const transaction = client.transaction()

  // 1. Conference
  console.log('Creating conference...')
  transaction.createOrReplace({
    _id: 'conference',
    _type: 'conference',
    name: 'ContentOps Conf',
    slug: {_type: 'slug', current: 'contentops-conf'},
    tagline: 'Where content becomes infrastructure',
    description:
      'A conference about building content operating systems — platforms where structured content drives websites, emails, AI agents, and automation from a single source of truth. Every talk showcases a real feature from this open-source conference starter.',
    startDate: '2026-10-15T09:00:00-04:00',
    endDate: '2026-10-16T18:00:00-04:00',
    venue: ref('venue-main'),
    tracks: tracks.map((t) => keyedRef(t._id)),
    organizers: [keyedRef('person-knut')],
    cfpOpen: true,
    cfpDeadline: '2026-08-15T23:59:59-04:00',
    cfpGuidelines:
      'We are looking for talks that showcase real-world content operations — how structured content drives websites, emails, AI, and automation. Proposals should focus on concrete problems, specific solutions, and lessons learned. Case studies and live demos are strongly encouraged.',
    scoringCriteria: [
      {
        _type: 'scoringCriterion',
        _key: 'relevance',
        name: 'Topic Relevance',
        description: 'How well does the proposal align with content operations and structured content?',
        weight: 30,
      },
      {
        _type: 'scoringCriterion',
        _key: 'expertise',
        name: 'Speaker Expertise',
        description: 'Does the speaker have demonstrable experience with the topic?',
        weight: 30,
      },
      {
        _type: 'scoringCriterion',
        _key: 'quality',
        name: 'Proposal Quality',
        description: 'Is the abstract clear, well-structured, and compelling?',
        weight: 25,
      },
      {
        _type: 'scoringCriterion',
        _key: 'diversity',
        name: 'Perspective Diversity',
        description: 'Does the proposal bring a unique perspective or underrepresented viewpoint?',
        weight: 15,
      },
    ],
  })

  // 2. Tracks
  console.log('Creating tracks...')
  for (const t of tracks) {
    transaction.createOrReplace(t)
  }

  // 3. Venue
  console.log('Creating venue...')
  transaction.createOrReplace(venue)

  // 4. Rooms
  console.log('Creating rooms...')
  for (const r of rooms) {
    transaction.createOrReplace(r)
  }

  // 5. People
  console.log('Creating people...')
  for (const p of people) {
    transaction.createOrReplace({
      _id: p._id,
      _type: 'person',
      name: p.name,
      slug: slug(p.name),
      role: p.role,
      company: p.company,
      travelStatus: 'not-started',
      bio: [textBlock(p.bio, 'bio-1')],
    })
  }

  // 6. Sessions
  console.log('Creating sessions...')
  for (const s of sessions) {
    const doc: Record<string, unknown> = {
      _id: s._id,
      _type: 'session',
      title: s.title,
      slug: slug(s.title),
      sessionType: s.sessionType,
      duration: s.duration,
    }

    if (s.level) doc.level = s.level
    if (s.track) doc.track = ref(s.track)
    if (s.speakers) {
      doc.speakers = s.speakers.map((id) => keyedRef(id))
    }
    if (s.abstract) {
      doc.abstract = [textBlock(s.abstract, 'abs-1')]
    }

    transaction.createOrReplace(doc)
  }

  // 7. Schedule slots
  console.log('Creating schedule slots...')
  for (const entry of schedule) {
    const session = sessions.find((s) => s._id === entry.sessionId)
    if (!session) continue

    const [startH, startM] = entry.start.split(':').map(Number)
    const endMinutes = startH * 60 + startM + session.duration
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0')
    const endM = (endMinutes % 60).toString().padStart(2, '0')

    transaction.createOrReplace({
      _id: `slot-${entry.sessionId}-${entry.room}`,
      _type: 'scheduleSlot',
      session: ref(entry.sessionId),
      conference: ref('conference'),
      startTime: `${entry.day}T${entry.start}:00-04:00`,
      endTime: `${entry.day}T${endH}:${endM}:00-04:00`,
      room: ref(entry.room),
      isPlenary: entry.isPlenary || false,
    })
  }

  // 8. Sponsors
  console.log('Creating sponsors...')
  for (const s of sponsors) {
    transaction.createOrReplace({
      _id: s._id,
      _type: 'sponsor',
      name: s.name,
      slug: slug(s.name),
      tier: s.tier,
      website: s.website,
      description: [textBlock(s.description, 'desc-1')],
      order: s.order,
    })
  }

  // Commit
  console.log('\nCommitting transaction...')
  const result = await transaction.commit()
  console.log(`Done! ${result.documentIds.length} documents created/updated.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
