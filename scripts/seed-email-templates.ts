/**
 * Seed script for email template documents.
 * Creates 4 emailTemplate documents with Portable Text body containing
 * pteInterpolationVariable inline objects for dynamic values.
 *
 * Usage (from apps/studio/):
 *   cp ../../scripts/seed-email-templates.ts . && npx sanity exec ./seed-email-templates.ts --with-user-token && rm seed-email-templates.ts
 *
 * Note: getCliClient only receives the token when the script path is within the studio directory.
 * The ../../ relative path breaks --with-user-token injection.
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-11-01'})

// Helper to create a variable inline object
function variable(key: string) {
  return {_type: 'pteInterpolationVariable', _key: `var-${key}`, variableKey: key}
}

// Helper to create a text span
function span(text: string, key: string) {
  return {_type: 'span', _key: key, text, marks: []}
}

// Helper to create a normal paragraph block with mixed content
function block(children: Array<Record<string, unknown>>, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children,
  }
}

function heading(text: string, key: string, style: 'h1' | 'h2' | 'h3' = 'h1') {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
  }
}

// ─── Templates ──────────────────────────────────────────────────────────

const templates = [
  {
    _id: 'emailTemplate.cfp-confirmation',
    _type: 'emailTemplate',
    name: 'CFP Confirmation',
    slug: {_type: 'slug', current: 'cfp-confirmation'},
    subject: 'Submission received: {{sessionTitle}}',
    audience: 'submitters',
    trigger: 'on-submission-received',
    status: 'active',
    body: [
      heading('Submission Received', 'b1'),
      block(
        [span('Hi ', 's1'), variable('submitterName'), span(',', 's2')],
        'b2',
      ),
      block(
        [
          span('Thanks for submitting ', 's3'),
          variable('sessionTitle'),
          span(' to ', 's4'),
          variable('conferenceName'),
          span(
            "! We're excited to review your proposal.",
            's5',
          ),
        ],
        'b3',
      ),
      block([span("Here's what happens next:", 's6')], 'b4'),
      block(
        [span('1. Your submission will be screened by our AI-assisted review system', 's7')],
        'b5',
      ),
      block(
        [span('2. Our editorial team will review top-scoring proposals', 's8')],
        'b6',
      ),
      block(
        [span("3. You'll receive a decision via email", 's9')],
        'b7',
      ),
      block(
        [
          span(
            "This process typically takes 2-3 weeks. We'll keep you posted on any updates.",
            's10',
          ),
        ],
        'b8',
      ),
      block(
        [span('If you have questions about your submission, reply to this email.', 's11')],
        'b9',
      ),
    ],
  },
  {
    _id: 'emailTemplate.cfp-accepted',
    _type: 'emailTemplate',
    name: 'CFP Accepted',
    slug: {_type: 'slug', current: 'cfp-accepted'},
    subject: 'Your talk "{{sessionTitle}}" has been accepted!',
    audience: 'submitters',
    trigger: 'on-submission-accepted',
    status: 'active',
    body: [
      heading('Your Talk Has Been Accepted!', 'b1'),
      block(
        [span('Hi ', 's1'), variable('submitterName'), span(',', 's2')],
        'b2',
      ),
      block(
        [
          span("Great news! We're thrilled to let you know that ", 's3'),
          variable('sessionTitle'),
          span(' has been accepted for ', 's4'),
          variable('conferenceName'),
          span('.', 's5'),
        ],
        'b3',
      ),
      block(
        [
          span(
            "We received many outstanding proposals and yours stood out. We can't wait for you to share your ideas with our audience.",
            's6',
          ),
        ],
        'b4',
      ),
      heading('Next Steps', 'b5', 'h3'),
      block(
        [span('1. Confirm your participation by replying to this email', 's7')],
        'b6',
      ),
      block(
        [span("2. We'll create your speaker profile on our website", 's8')],
        'b7',
      ),
      block(
        [
          span(
            "3. You'll receive a speaker welcome email with logistics details",
            's9',
          ),
        ],
        'b8',
      ),
      block(
        [
          span(
            'If you can no longer present, please let us know as soon as possible so we can offer the slot to another speaker.',
            's10',
          ),
        ],
        'b9',
      ),
    ],
  },
  {
    _id: 'emailTemplate.cfp-rejected',
    _type: 'emailTemplate',
    name: 'CFP Rejected',
    slug: {_type: 'slug', current: 'cfp-rejected'},
    subject: 'Update on your submission: {{sessionTitle}}',
    audience: 'submitters',
    trigger: 'on-submission-rejected',
    status: 'active',
    body: [
      heading('Thank You for Submitting', 'b1'),
      block(
        [span('Hi ', 's1'), variable('submitterName'), span(',', 's2')],
        'b2',
      ),
      block(
        [
          span('Thank you for submitting ', 's3'),
          variable('sessionTitle'),
          span(' to ', 's4'),
          variable('conferenceName'),
          span(
            '. We appreciate the time and effort you put into your proposal.',
            's5',
          ),
        ],
        'b3',
      ),
      block(
        [
          span(
            "After careful review, we're unable to include your session in this year's program. We received an exceptional number of submissions and the selection process was highly competitive.",
            's6',
          ),
        ],
        'b4',
      ),
      block(
        [
          span(
            "This doesn't reflect on the quality of your work — we encourage you to submit again in the future and to join us as an attendee. We'd love to see you there.",
            's7',
          ),
        ],
        'b5',
      ),
      block(
        [
          span(
            'If you have questions about our review process, feel free to reply to this email.',
            's8',
          ),
        ],
        'b6',
      ),
    ],
  },
  {
    _id: 'emailTemplate.speaker-welcome',
    _type: 'emailTemplate',
    name: 'Speaker Welcome',
    slug: {_type: 'slug', current: 'speaker-welcome'},
    subject: 'Welcome to the {{conferenceName}} speaker roster!',
    audience: 'speakers',
    trigger: 'on-speaker-confirmed',
    status: 'active',
    body: [
      heading('Welcome, Speaker!', 'b1'),
      block(
        [span('Hi ', 's1'), variable('speakerName'), span(',', 's2')],
        'b2',
      ),
      block(
        [
          span('Welcome to the ', 's3'),
          variable('conferenceName'),
          span(' speaker roster! Your session ', 's4'),
          variable('sessionTitle'),
          span(
            ' has been added to our program and your speaker profile is now live on our website.',
            's5',
          ),
        ],
        'b3',
      ),
      heading('Speaker Checklist', 'b4', 'h3'),
      block(
        [span('Review your speaker profile and let us know of any updates', 's6')],
        'b5',
      ),
      block([span('Confirm your travel arrangements', 's7')], 'b6'),
      block([span('Submit your slides 1 week before the event', 's8')], 'b7'),
      block(
        [span('Join the speaker Slack channel (invite link coming soon)', 's9')],
        'b8',
      ),
      heading('Important Dates', 'b9h', 'h3'),
      block(
        [
          span(
            "We'll share the full schedule and your assigned time slot closer to the event. In the meantime, please ensure your availability for the full conference dates.",
            's10',
          ),
        ],
        'b10',
      ),
      block(
        [
          span(
            'For logistics questions (travel, AV requirements, dietary needs), reply to this email.',
            's11',
          ),
        ],
        'b11',
      ),
    ],
  },
]

// ─── Main ────────────────────────────────────────────────────────────────

async function seed() {
  const {projectId, dataset} = client.config()
  console.log(`Seeding email templates into ${projectId}/${dataset}...\n`)

  const tx = client.transaction()
  for (const template of templates) {
    console.log(`  ${template._id} — "${template.name}"`)
    tx.createIfNotExists(template)
  }

  const result = await tx.commit()
  console.log(`\n${result.documentIds.length} template(s) seeded.`)
  console.log('Done!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
