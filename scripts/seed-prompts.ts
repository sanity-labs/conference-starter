/**
 * Seed script for prompts, FAQs, email templates, submissions, announcements,
 * and code of conduct page.
 *
 * Usage (from apps/studio/ — script must be local for --with-user-token to inject):
 *   cp ../../scripts/seed-prompts.ts . && npx sanity exec ./seed-prompts.ts --with-user-token && rm seed-prompts.ts
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-03-15'})

// ─── Helpers ─────────────────────────────────────────────────────────────

function textBlock(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-s`, marks: [], text}],
  }
}

function headingBlock(text: string, key: string, style: 'h1' | 'h2' | 'h3' = 'h2') {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-s`, marks: [], text}],
  }
}

function variable(key: string) {
  return {_type: 'pteInterpolationVariable', _key: `var-${key}`, variableKey: key}
}

function span(text: string, key: string) {
  return {_type: 'span', _key: key, text, marks: []}
}

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

// ─── Prompts ─────────────────────────────────────────────────────────────

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
    instruction: `You are the ContentOps Conf operations assistant, available to conference organizers via Telegram.

The conference has three tracks:
- Structure That Scales (content modeling, GROQ, type-safe schemas)
- AI That Works (CFP screening, agents, AI concierge)
- Build Without Limits (monorepos, edge rendering, visual editing, email pipelines)

You can help with:
- Reviewing CFP submissions (search by topic, score, status)
- Checking session schedules and speaker assignments
- Viewing speaker logistics and bios
- Viewing sponsor details
- Checking schedule slot assignments

When listing items, format them clearly. Reference document titles when discussing specific content. Confirm before making any changes.

FORMATTING: You are writing for Telegram plain text. Do NOT use markdown formatting (no **bold**, *italic*, # headings, or [links](url)). Use plain text, line breaks, and simple bullet characters (•) for lists. Emoji are fine.`,
    description:
      'System prompt for the Telegram organizer bot. Uses content-agent for full Content Lake access.',
  },
  {
    _id: 'prompt.botAttendee',
    _type: 'prompt',
    title: 'Telegram Attendee Bot',
    instruction: `You are the ContentOps Conf conference assistant, helping attendees get the most out of the event.

ContentOps Conf is about building content operating systems — platforms where structured content drives websites, emails, AI agents, and automation from a single source of truth. Every talk showcases a feature from this open-source conference starter.

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
- If you don't know something, say so and suggest asking a volunteer at the info desk

FORMATTING: You are writing for Telegram plain text. Do NOT use markdown formatting (no **bold**, *italic*, # headings, or [links](url)). Use plain text, line breaks, and simple bullet characters (•) for lists. Emoji are fine.`,
    description:
      'System prompt for the attendee-facing Telegram bot. Read-only Content Agent access to public conference data.',
  },
]

// ─── FAQs ────────────────────────────────────────────────────────────────

const faqs = [
  {
    _type: 'faq',
    question: 'What is ContentOps Conf?',
    answer: [
      textBlock(
        'A conference about building content operating systems. Every talk showcases a feature from this open-source conference starter — the same platform running the event. Think of it as a meta-conference: the product is the conference, and the conference is the product.',
        'a1',
      ),
    ],
    category: 'general',
  },
  {
    _type: 'faq',
    question: 'Who is this for?',
    answer: [
      textBlock(
        'Developers building content-heavy applications, engineering managers evaluating headless CMS options, and product managers who want to understand what structured content makes possible. Whether you write code, manage teams, or shape product strategy, the talks cover your angle.',
        'a1',
      ),
    ],
    category: 'general',
  },
  {
    _type: 'faq',
    question: 'What makes this different from a CMS conference?',
    answer: [
      textBlock(
        'This is not about picking a CMS. It is about content as infrastructure — how structured content drives websites, emails, AI agents, and automation from one source of truth. The talks cover architecture, engineering patterns, and operational workflows, not product demos.',
        'a1',
      ),
    ],
    category: 'general',
  },
  {
    _type: 'faq',
    question: 'Is the venue accessible?',
    answer: [
      textBlock(
        'Yes, The Glasshouse is fully wheelchair accessible. All session rooms, restrooms, and common areas are accessible. Email access@contentops.dev for specific accommodations.',
        'a1',
      ),
    ],
    category: 'accessibility',
  },
  {
    _type: 'faq',
    question: 'What are the food options?',
    answer: [
      textBlock(
        'Lunch on both days. Vegetarian, vegan, gluten-free, and halal options available. Indicate requirements during registration. Coffee and snacks throughout.',
        'a1',
      ),
    ],
    category: 'venue',
  },
  {
    _type: 'faq',
    question: 'Will sessions be recorded?',
    answer: [
      textBlock(
        'Most sessions are recorded and published after the conference. Speakers can opt out. Workshops are not recorded to encourage interactive participation.',
        'a1',
      ),
    ],
    category: 'general',
  },
  {
    _type: 'faq',
    question: 'Can I get a refund?',
    answer: [
      textBlock(
        'Full refund up to 30 days before the event. Within 30 days, tickets can be transferred to another person at no charge. Email registration@contentops.dev.',
        'a1',
      ),
    ],
    category: 'registration',
  },
]

// ─── Email Templates ─────────────────────────────────────────────────────

const emailTemplates = [
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
      block([span('Hi ', 's1'), variable('submitterName'), span(',', 's2')], 'b2'),
      block(
        [
          span('Thanks for submitting ', 's3'),
          variable('sessionTitle'),
          span(' to ', 's4'),
          variable('conferenceName'),
          span("! We're excited to review your proposal.", 's5'),
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
      block([span("3. You'll receive a decision via email", 's9')], 'b7'),
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
      block([span('Hi ', 's1'), variable('submitterName'), span(',', 's2')], 'b2'),
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
        [span("3. You'll receive a speaker welcome email with logistics details", 's9')],
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
      block([span('Hi ', 's1'), variable('submitterName'), span(',', 's2')], 'b2'),
      block(
        [
          span('Thank you for submitting ', 's3'),
          variable('sessionTitle'),
          span(' to ', 's4'),
          variable('conferenceName'),
          span('. We appreciate the time and effort you put into your proposal.', 's5'),
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
      block([span('Hi ', 's1'), variable('speakerName'), span(',', 's2')], 'b2'),
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
  // ─── Scheduled Email Templates ──────────────────────────────────────────
  {
    _id: 'emailTemplate.digest-preview',
    _type: 'emailTemplate',
    name: 'Daily Digest — Preview (Day Before)',
    slug: {_type: 'slug', current: 'digest-preview'},
    subject: "Tomorrow at {{conferenceName}}: {{scheduleDate}}",
    audience: 'all-attendees',
    trigger: 'daily-digest',
    status: 'active',
    body: [
      heading("Tomorrow's Schedule", 'dp-b1'),
      block(
        [
          span("Here's what's coming up on ", 'dp-s1'),
          variable('scheduleDate'),
          span(' at ', 'dp-s2'),
          variable('conferenceName'),
          span('.', 'dp-s3'),
        ],
        'dp-b2',
      ),
      textBlock(
        'Get ready for a packed day of sessions, workshops, and conversations. The full schedule is below.',
        'dp-b3',
      ),
    ],
  },
  {
    _id: 'emailTemplate.digest-day',
    _type: 'emailTemplate',
    name: 'Daily Digest — Conference Day',
    slug: {_type: 'slug', current: 'digest-day'},
    subject: "Today at {{conferenceName}}: {{scheduleDate}}",
    audience: 'all-attendees',
    trigger: 'daily-digest',
    status: 'active',
    body: [
      heading("Today's Schedule", 'dd-b1'),
      block(
        [
          span('Good morning! Here is the schedule for ', 'dd-s1'),
          variable('scheduleDate'),
          span(' at ', 'dd-s2'),
          variable('conferenceName'),
          span('.', 'dd-s3'),
        ],
        'dd-b2',
      ),
    ],
  },
  {
    _id: 'emailTemplate.cfp-closing-soon',
    _type: 'emailTemplate',
    name: 'CFP Closing Soon',
    slug: {_type: 'slug', current: 'cfp-closing-soon'},
    subject: "CFP closes in {{daysUntilEvent}} — submit your proposal",
    audience: 'all-attendees',
    trigger: 'reminder',
    status: 'active',
    body: [
      heading('CFP Closing Soon', 'cs-b1'),
      block(
        [
          span('The call for proposals for ', 'cs-s1'),
          variable('conferenceName'),
          span(' closes on ', 'cs-s2'),
          variable('cfpDeadlineDate'),
          span(' — that\'s ', 'cs-s3'),
          variable('daysUntilEvent'),
          span(' from now.', 'cs-s4'),
        ],
        'cs-b2',
      ),
      textBlock(
        'Whether you have built a content pipeline, shipped an AI agent, or solved a gnarly GROQ query — we want to hear about it.',
        'cs-b3',
      ),
      textBlock('Submit your proposal before the deadline.', 'cs-b4'),
    ],
  },
  {
    _id: 'emailTemplate.cfp-closing-today',
    _type: 'emailTemplate',
    name: 'CFP Closing Today',
    slug: {_type: 'slug', current: 'cfp-closing-today'},
    subject: "Last chance: {{conferenceName}} CFP closes today",
    audience: 'all-attendees',
    trigger: 'reminder',
    status: 'active',
    body: [
      heading('Last Chance to Submit', 'ct-b1'),
      block(
        [
          span('The call for proposals for ', 'ct-s1'),
          variable('conferenceName'),
          span(' closes today. If you have been thinking about submitting, now is the time.', 'ct-s2'),
        ],
        'ct-b2',
      ),
      textBlock("Don't miss this opportunity to share your work with the content operations community.", 'ct-b3'),
    ],
  },
  {
    _id: 'emailTemplate.event-reminder-week',
    _type: 'emailTemplate',
    name: 'Event Reminder — 1 Week',
    slug: {_type: 'slug', current: 'event-reminder-week'},
    subject: "{{conferenceName}} starts in {{daysUntilEvent}}",
    audience: 'all-attendees',
    trigger: 'reminder',
    status: 'active',
    body: [
      heading('One Week to Go', 'ew-b1'),
      block(
        [
          variable('conferenceName'),
          span(' starts in ', 'ew-s1'),
          variable('daysUntilEvent'),
          span('. Here is what you need to know:', 'ew-s2'),
        ],
        'ew-b2',
      ),
      textBlock('Check the schedule and plan which sessions you want to attend.', 'ew-b3'),
      textBlock('Make sure your travel and accommodation are confirmed.', 'ew-b4'),
      textBlock('Join the conversation on social media — we will be sharing speaker spotlights all week.', 'ew-b5'),
    ],
  },
  {
    _id: 'emailTemplate.event-reminder-tomorrow',
    _type: 'emailTemplate',
    name: 'Event Reminder — Tomorrow',
    slug: {_type: 'slug', current: 'event-reminder-tomorrow'},
    subject: "{{conferenceName}} starts tomorrow!",
    audience: 'all-attendees',
    trigger: 'reminder',
    status: 'active',
    body: [
      heading('See You Tomorrow', 'et-b1'),
      block(
        [
          variable('conferenceName'),
          span(' kicks off tomorrow. We cannot wait to see you there.', 'et-s1'),
        ],
        'et-b2',
      ),
      textBlock('Doors open at 8:30 AM. Grab your badge at registration and get settled before the opening keynote.', 'et-b3'),
      textBlock('Check the full schedule on our website so you know where to be and when.', 'et-b4'),
    ],
  },
  {
    _id: 'emailTemplate.post-event-thanks',
    _type: 'emailTemplate',
    name: 'Post-Event Thank You',
    slug: {_type: 'slug', current: 'post-event-thanks'},
    subject: "Thank you for attending {{conferenceName}}",
    audience: 'all-attendees',
    trigger: 'reminder',
    status: 'active',
    body: [
      heading('Thank You', 'pt-b1'),
      block(
        [
          span('Thank you for being part of ', 'pt-s1'),
          variable('conferenceName'),
          span('. We hope you had a great experience.', 'pt-s2'),
        ],
        'pt-b2',
      ),
      textBlock('Session recordings will be published in the coming weeks. We will email you when they are available.', 'pt-b3'),
      textBlock('If you have feedback about the conference, we would love to hear it — reply to this email.', 'pt-b4'),
      textBlock('See you next year.', 'pt-b5'),
    ],
  },
]

// ─── CFP Submissions ─────────────────────────────────────────────────────

const submissions = [
  {
    _type: 'submission',
    sessionTitle: 'Headless Commerce with Sanity and Shopify',
    sessionType: 'talk',
    level: 'intermediate',
    abstract:
      'A practical guide to building headless commerce experiences where Sanity manages product storytelling and Shopify handles transactions. Covers content modeling for product pages, real-time inventory-aware rendering, and the editorial workflows that let marketing teams ship without deployments.',
    topics: ['e-commerce', 'headless', 'integrations'],
    submitterName: 'Lena Park',
    submitterEmail: 'lena.park@example.com',
    company: 'Shopify',
    bio: 'Lena is a developer advocate at Shopify focusing on headless commerce architectures. She has helped hundreds of merchants build custom storefronts with composable content systems.',
    status: 'scored',
    submittedAt: '2026-06-15T14:30:00Z',
    aiScreening: {
      _type: 'aiScreening',
      score: 78,
      summary:
        'Strong practical proposal with clear commerce use case. Good speaker background in the space. Abstract could be more specific about the Sanity integration patterns.',
      scoredAt: '2026-06-15T14:35:00Z',
    },
    conference: {_type: 'reference', _ref: 'conference'},
  },
  {
    _type: 'submission',
    sessionTitle: 'Real-time Collaboration Patterns in Content Teams',
    sessionType: 'talk',
    level: 'advanced',
    abstract:
      'How do you build real-time collaboration into a content authoring experience without conflicts, data loss, or confusion? This talk covers the operational transform and CRDT-inspired patterns behind collaborative editing, presence indicators, and the UX decisions that make multiplayer content feel natural.',
    topics: ['collaboration', 'real-time', 'editorial'],
    submitterName: 'Marcus Webb',
    submitterEmail: 'marcus.webb@example.com',
    company: 'Figma',
    bio: 'Marcus is a senior engineer at Figma working on real-time collaboration infrastructure. Previously built collaborative editing systems for Google Docs.',
    status: 'accepted',
    submittedAt: '2026-06-10T09:15:00Z',
    aiScreening: {
      _type: 'aiScreening',
      score: 92,
      summary:
        'Exceptional proposal. Deep technical expertise from a leader in real-time collaboration. Directly relevant to content operations. Highly recommended.',
      scoredAt: '2026-06-10T09:20:00Z',
    },
    conference: {_type: 'reference', _ref: 'conference'},
  },
  {
    _type: 'submission',
    sessionTitle: 'Why We Migrated Away from WordPress (and Back)',
    sessionType: 'lightning',
    level: 'beginner',
    abstract:
      'We moved our blog from WordPress to a headless CMS, then moved it back. This lightning talk covers what went wrong, what we learned, and why sometimes the boring choice is the right choice.',
    topics: ['migration', 'WordPress', 'CMS'],
    submitterName: 'Rajesh Patel',
    submitterEmail: 'rajesh.patel@example.com',
    company: 'BlogScale',
    bio: 'Rajesh runs a content agency that manages blogs for mid-size companies. He has opinions about CMS choices.',
    status: 'rejected',
    submittedAt: '2026-06-20T16:45:00Z',
    aiScreening: {
      _type: 'aiScreening',
      score: 34,
      summary:
        'Topic does not align well with the conference focus on content operations and structured content. The backwards migration narrative, while honest, lacks actionable insights for the audience.',
      scoredAt: '2026-06-20T16:50:00Z',
    },
    conference: {_type: 'reference', _ref: 'conference'},
  },
  {
    _type: 'submission',
    sessionTitle: 'Building Accessible Content Authoring Experiences',
    sessionType: 'talk',
    level: 'intermediate',
    abstract:
      'Accessibility in content platforms means two things: the content editors produce must be accessible, and the editing experience itself must be accessible. This talk covers both — ARIA patterns for rich text editors, automated content accessibility checks, and how to build Studio plugins that work with screen readers.',
    topics: ['accessibility', 'authoring', 'a11y'],
    submitterName: 'Aisha Johnson',
    submitterEmail: 'aisha.johnson@example.com',
    company: 'Deque',
    bio: 'Aisha is an accessibility engineer at Deque, makers of axe. She specializes in making complex web applications accessible and has contributed to the ARIA authoring practices guide.',
    status: 'in-review',
    submittedAt: '2026-06-18T11:00:00Z',
    aiScreening: {
      _type: 'aiScreening',
      score: 85,
      summary:
        'Excellent proposal covering an underserved but important topic. Strong speaker credentials in accessibility. Good balance of authoring UX and output accessibility. Recommended for review.',
      scoredAt: '2026-06-18T11:05:00Z',
    },
    conference: {_type: 'reference', _ref: 'conference'},
  },
  {
    _type: 'submission',
    sessionTitle: 'Content Mesh: Federating Multiple Content Sources',
    sessionType: 'workshop',
    level: 'advanced',
    abstract:
      'Most organizations have content in multiple systems. This workshop walks through building a content mesh — a federation layer that queries across Sanity, Contentful, and custom APIs using a unified schema. Participants will build a working federation gateway and learn when federation helps vs. when migration is better.',
    topics: ['federation', 'content-mesh', 'architecture'],
    submitterName: 'Henrik Larsson',
    submitterEmail: 'henrik.larsson@example.com',
    company: 'Contentful',
    bio: 'Henrik is a solutions architect at Contentful. He works with enterprise customers on multi-CMS strategies and content federation patterns.',
    status: 'scored',
    submittedAt: '2026-06-22T08:30:00Z',
    aiScreening: {
      _type: 'aiScreening',
      score: 62,
      summary:
        'Interesting technical topic but potentially misaligned with conference philosophy of unified content operations. Workshop format is good for the complexity. Speaker has relevant enterprise experience.',
      scoredAt: '2026-06-22T08:35:00Z',
    },
    conference: {_type: 'reference', _ref: 'conference'},
  },
  {
    _type: 'submission',
    sessionTitle: 'Sanity Functions: Event-Driven Content Automation',
    sessionType: 'talk',
    level: 'intermediate',
    abstract:
      'Content changes should trigger actions automatically — sending emails, updating search indices, notifying stakeholders, scoring submissions. This talk covers Sanity Functions (Blueprints): how to write event handlers in TypeScript, deploy them alongside your Studio, and build automation that treats content events as the source of truth.',
    topics: ['automation', 'serverless', 'events'],
    submitterName: 'Tomoko Yamada',
    submitterEmail: 'tomoko.yamada@example.com',
    company: 'Rakuten',
    bio: 'Tomoko is a platform engineer at Rakuten working on content automation for their marketplace. She has built event-driven content systems serving millions of product pages.',
    status: 'submitted',
    submittedAt: '2026-07-01T13:00:00Z',
    conference: {_type: 'reference', _ref: 'conference'},
  },
]

// ─── Announcements ───────────────────────────────────────────────────────

const announcements = [
  {
    _type: 'announcement',
    title: 'CFP is now open!',
    slug: {_type: 'slug', current: 'cfp-is-now-open'},
    body: 'We are accepting proposals for ContentOps Conf. Whether you have built a content pipeline, shipped an AI agent, or solved a gnarly GROQ query — we want to hear about it. Submit by August 15.',
    status: 'published',
    publishedAt: '2026-05-01T10:00:00Z',
  },
  {
    _type: 'announcement',
    title: 'Schedule published',
    slug: {_type: 'slug', current: 'schedule-published'},
    body: 'The full two-day schedule is live. Two tracks running in parallel plus keynotes and a closing panel. See the schedule page for details.',
    status: 'published',
    publishedAt: '2026-09-01T10:00:00Z',
  },
  {
    _type: 'announcement',
    title: 'Workshop capacity update',
    slug: {_type: 'slug', current: 'workshop-capacity-update'},
    body: 'Workshop sessions in The Schema Lab and The Query Engine are limited to 40 seats each. Register early to secure your spot.',
    status: 'draft',
  },
]

// ─── Code of Conduct Page ────────────────────────────────────────────────

const codeOfConduct = {
  _type: 'page',
  title: 'Code of Conduct',
  slug: {_type: 'slug', current: 'code-of-conduct'},
  sections: [
    {
      _type: 'richText',
      _key: 'coc-section',
      body: [
        headingBlock('Our Commitment', 'coc-1', 'h2'),
        textBlock(
          'ContentOps Conf is dedicated to providing a harassment-free experience for everyone, regardless of gender, gender identity and expression, age, sexual orientation, disability, physical appearance, body size, race, ethnicity, religion, or technology choices. We do not tolerate harassment of participants in any form.',
          'coc-2',
        ),
        headingBlock('Expected Behavior', 'coc-3', 'h2'),
        textBlock(
          'Be respectful and considerate in your speech and actions. Refrain from demeaning, discriminatory, or harassing behavior and speech. Be mindful of your surroundings and of your fellow participants. Alert conference organizers if you notice a dangerous situation or someone in distress.',
          'coc-4',
        ),
        headingBlock('Unacceptable Behavior', 'coc-5', 'h2'),
        textBlock(
          'Harassment includes offensive verbal comments related to gender, sexual orientation, disability, physical appearance, body size, race, religion, sexual images in public spaces, deliberate intimidation, stalking, following, harassing photography or recording, sustained disruption of talks or events, inappropriate physical contact, and unwelcome sexual attention.',
          'coc-6',
        ),
        headingBlock('Reporting', 'coc-7', 'h2'),
        textBlock(
          'If you experience or witness unacceptable behavior, or have any other concerns, please notify a conference organizer as soon as possible. You can find organizers at the registration desk, or email conduct@contentops.dev. All reports will be handled with discretion.',
          'coc-8',
        ),
        headingBlock('Consequences', 'coc-9', 'h2'),
        textBlock(
          'Participants asked to stop any harassing behavior are expected to comply immediately. If a participant engages in harassing behavior, the conference organizers may take any action they deem appropriate, including warning the offender, expulsion from the conference with no refund, or referral to local law enforcement.',
          'coc-10',
        ),
      ],
    },
  ],
}

// ─── Main ────────────────────────────────────────────────────────────────

async function seed() {
  const {projectId, dataset} = client.config()
  console.log(`Seeding into ${projectId}/${dataset}...\n`)

  // 1. Prompts (createOrReplace — always update)
  console.log('Seeding prompts...')
  const promptTx = client.transaction()
  for (const prompt of prompts) {
    console.log(`  ${prompt._id} — "${prompt.title}"`)
    promptTx.createOrReplace(prompt)
  }
  const promptResult = await promptTx.commit()
  console.log(`  ${promptResult.documentIds.length} prompt(s) seeded.\n`)

  // 2. Email templates (createOrReplace — always update)
  console.log('Seeding email templates...')
  const emailTx = client.transaction()
  for (const template of emailTemplates) {
    console.log(`  ${template._id} — "${template.name}"`)
    emailTx.createOrReplace(template)
  }
  const emailResult = await emailTx.commit()
  console.log(`  ${emailResult.documentIds.length} template(s) seeded.\n`)

  // 3. FAQs (skip if already exist)
  const existingFaqCount = await client.fetch<number>(`count(*[_type == "faq"])`)
  if (existingFaqCount > 0) {
    console.log(`Skipping FAQ seed — ${existingFaqCount} FAQ(s) already exist.\n`)
  } else {
    console.log('Seeding FAQs...')
    for (const faq of faqs) {
      const created = await client.create(faq)
      console.log(`  ${created._id} — "${faq.question}"`)
    }
    console.log(`  ${faqs.length} FAQ(s) created.\n`)
  }

  // 4. Submissions (skip if already exist)
  const existingSubCount = await client.fetch<number>(`count(*[_type == "submission"])`)
  if (existingSubCount > 0) {
    console.log(`Skipping submission seed — ${existingSubCount} submission(s) already exist.\n`)
  } else {
    console.log('Seeding CFP submissions...')
    for (const sub of submissions) {
      const created = await client.create(sub)
      console.log(`  ${created._id} — "${sub.sessionTitle}" (${sub.status})`)
    }
    console.log(`  ${submissions.length} submission(s) created.\n`)
  }

  // 5. Announcements (skip if already exist)
  const existingAnnCount = await client.fetch<number>(`count(*[_type == "announcement"])`)
  if (existingAnnCount > 0) {
    console.log(
      `Skipping announcement seed — ${existingAnnCount} announcement(s) already exist.\n`,
    )
  } else {
    console.log('Seeding announcements...')
    for (const ann of announcements) {
      const created = await client.create(ann)
      console.log(`  ${created._id} — "${ann.title}" (${ann.status})`)
    }
    console.log(`  ${announcements.length} announcement(s) created.\n`)
  }

  // 6. Code of Conduct page (skip if exists)
  let cocId: string | null = null
  const existingCocId = await client.fetch<string | null>(
    `*[_type == "page" && slug.current == "code-of-conduct"][0]._id`,
  )
  if (existingCocId) {
    console.log('Skipping code of conduct — page already exists.\n')
    cocId = existingCocId
  } else {
    console.log('Seeding code of conduct page...')
    const created = await client.create(codeOfConduct)
    console.log(`  ${created._id} — "Code of Conduct"\n`)
    cocId = created._id
  }

  // 7. Append Code of Conduct to footer nav (if not already there)
  if (cocId) {
    const footerNav = await client.fetch<Array<{_key: string; linkType: string | null}> | null>(
      `*[_type == "conference"][0].footerNav`,
    )
    const alreadyLinked = footerNav?.some((item) => item._key === 'fnav-coc')
    if (!alreadyLinked) {
      console.log('Adding Code of Conduct to footer navigation...')
      await client
        .patch('conference')
        .append('footerNav', [
          {
            _type: 'navItem',
            _key: 'fnav-coc',
            title: 'Code of Conduct',
            linkType: 'page',
            page: {_type: 'reference', _ref: cocId},
          },
        ])
        .commit()
      console.log('  Added to footer nav.\n')
    } else {
      console.log('Code of Conduct already in footer nav.\n')
    }
  }

  console.log('Done!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
