/**
 * Seed script for AI prompt documents and FAQ data.
 *
 * Usage (from apps/studio/): npx sanity exec ../../scripts/seed-prompts.ts --with-user-token
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-03-15'})

// ─── Prompt documents ────────────────────────────────────────────────────

const prompts = [
  {
    _id: 'prompt.cfpScreening',
    _type: 'prompt',
    title: 'CFP Screening',
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
    description:
      'Used by the screen-cfp and rescreen-cfp functions to evaluate CFP submissions via Agent Actions. Variables: $title, $sessionType, $abstract, $bio, $criteria.',
  },
  {
    _id: 'prompt.botOps',
    _type: 'prompt',
    title: 'Telegram Ops Bot',
    instruction: `You are the Everything NYC 2026 operations assistant, available to conference organizers via Telegram.

You can help with:
- Reviewing CFP submissions (search by topic, score, status)
- Checking session schedules and speaker assignments
- Viewing speaker logistics and bios
- Viewing sponsor details
- Checking schedule slot assignments

When listing items, format them clearly. Reference document titles when discussing specific content. Confirm before making any changes.`,
    description:
      'System prompt for the Telegram organizer bot. Uses content-agent for full Content Lake access.',
  },
  {
    _id: 'prompt.botAttendee',
    _type: 'prompt',
    title: 'Telegram Attendee Bot',
    instruction: `You are the Everything NYC 2026 conference assistant, helping attendees get the most out of the event.

You can help with:
- Finding sessions by topic, speaker, or time
- Looking up speaker bios and information
- Checking the schedule and what's happening next
- Answering venue questions (WiFi, accessibility, food, parking)
- Sharing FAQ answers about the conference
- Providing sponsor information
- Recommending sessions based on interests

Guidelines:
- Keep answers short and friendly — attendees are on mobile
- When listing sessions or speakers, include the key details (time, room, track)
- You cannot make any changes to conference data — you are read-only
- Do not share internal operations data (CFP scores, submission reviews, organizer notes)
- If you don't know something, say so and suggest asking a volunteer at the info desk`,
    description:
      'System prompt for the attendee-facing Telegram bot. Read-only Content Agent access to public conference data.',
  },
]

// ─── FAQ seed documents ──────────────────────────────────────────────────

const faqs = [
  {
    _type: 'faq',
    question: 'What is the WiFi password?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'WiFi network and password details will be shared at check-in and displayed on signage throughout the venue. Look for the "EverythingNYC" network.',
          },
        ],
      },
    ],
    category: 'venue',
  },
  {
    _type: 'faq',
    question: 'What is the code of conduct?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Everything NYC 2026 is dedicated to providing a harassment-free experience for everyone. We do not tolerate harassment in any form. Participants asked to stop harassing behavior are expected to comply immediately. If you experience or witness a violation, please report it to any staff member or email conduct@everythingnyc.dev.',
          },
        ],
      },
    ],
    category: 'conduct',
  },
  {
    _type: 'faq',
    question: 'Is the venue wheelchair accessible?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Yes, the venue is fully wheelchair accessible. All session rooms, restrooms, and common areas are accessible. If you need specific accommodations, please email access@everythingnyc.dev and we will make arrangements.',
          },
        ],
      },
    ],
    category: 'accessibility',
  },
  {
    _type: 'faq',
    question: 'What are the lunch and dietary options?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Lunch is provided on both conference days. We offer vegetarian, vegan, gluten-free, and halal options. Please indicate dietary requirements during registration. Snacks and coffee are available throughout the day.',
          },
        ],
      },
    ],
    category: 'venue',
  },
  {
    _type: 'faq',
    question: 'Where can I park, and what are the transit options?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'We recommend taking public transit. The venue is a 5-minute walk from the subway. If you drive, there are several parking garages nearby — check the venue page on our website for details and directions.',
          },
        ],
      },
    ],
    category: 'venue',
  },
  {
    _type: 'faq',
    question: 'Can I get a refund or transfer my ticket?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Tickets can be fully refunded up to 30 days before the event. Within 30 days, tickets can be transferred to another person at no charge. Contact registration@everythingnyc.dev for transfers or refund requests.',
          },
        ],
      },
    ],
    category: 'registration',
  },
  {
    _type: 'faq',
    question: 'Will sessions be recorded?',
    answer: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Most sessions will be recorded and published on our YouTube channel after the conference. Speakers can opt out of recording. Workshop sessions are not recorded to encourage interactive participation.',
          },
        ],
      },
    ],
    category: 'general',
  },
]

// ─── Main ────────────────────────────────────────────────────────────────

async function seed() {
  const {projectId, dataset} = client.config()
  console.log(`Seeding into ${projectId}/${dataset}...\n`)

  // Seed prompts via transaction (createIfNotExists — won't overwrite existing)
  const promptTx = client.transaction()
  for (const prompt of prompts) {
    console.log(`  ${prompt._id} — "${prompt.title}"`)
    promptTx.createIfNotExists(prompt)
  }
  const promptResult = await promptTx.commit()
  console.log(`\n${promptResult.documentIds.length} prompt(s) seeded.\n`)

  // Seed FAQs via client.create (regular UUIDs — skip if FAQs already exist)
  const existingCount = await client.fetch<number>(`count(*[_type == "faq"])`)
  if (existingCount > 0) {
    console.log(`Skipping FAQ seed — ${existingCount} FAQ document(s) already exist.\n`)
  } else {
    console.log('Seeding FAQ documents...\n')
    for (const faq of faqs) {
      const created = await client.create(faq)
      console.log(`  ${created._id} — "${faq.question}"`)
    }
    console.log(`\n${faqs.length} FAQ document(s) created.\n`)
  }

  console.log('Done!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
