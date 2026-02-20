# Content Model Specification — Everything NYC 2026

> **Status:** DRAFT — Ready for team review
> **Author:** @eventide
> **Constraints:** D-002 (unified session), D-008 (showcase quality), D-014 (Visual Editing everywhere)
> **Litmus test:** The schedule page GROQ query must pull slots + session + speakers + track + room in one clean query, no N+1.

---

## Design Philosophy

This content model follows three principles:

1. **References over duplication** — A speaker is referenced, never embedded. Update once, reflect everywhere.
2. **Three-audience descriptions** — Every field description serves editors (what to enter), Content Agent (what this data means), and developers (how it's queried).
3. **Validation with empathy** — Error messages that help, not scold. "End time must be after start time" not "Invalid value."

---

## Document Types

### 1. `conference`

The top-level container. Everything NYC 2026 is a single conference document. All other documents reference back to it, making multi-conference support trivial later.

```ts
defineType({
  name: 'conference',
  title: 'Conference',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'venue', title: 'Venue & Logistics' },
    { name: 'branding', title: 'Branding' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Conference Name',
      type: 'string',
      group: 'details',
      description: 'The official name of the conference, displayed in the header, page titles, and email subject lines. Content Agent: use this as the canonical event name in all generated content.',
      validation: (rule) => rule.required().error('Every conference needs a name'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'details',
      description: 'URL-friendly identifier. Auto-generated from the conference name. Used in all page routes.',
      options: { source: 'name' },
      validation: (rule) => rule.required().error('Generate a slug — it powers all the page URLs'),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'details',
      description: 'A short, punchy subtitle displayed below the conference name on the homepage hero. Keep it under 100 characters. Content Agent: use this to capture the conference vibe in generated social copy.',
      validation: (rule) => rule.max(100).warning('Taglines work best under 100 characters'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'details',
      rows: 4,
      description: 'A 2-4 sentence overview of the conference. Displayed on the homepage, shared in social previews, and used by Content Agent as context when generating session descriptions or email content.',
      validation: (rule) => rule.required().min(50).error('Write at least a couple of sentences describing the conference'),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      group: 'details',
      description: 'When the conference begins. Used for countdown timers, schedule filtering, and Luma event sync. Content Agent: reference this when generating time-sensitive content like "only X days away."',
      validation: (rule) => rule.required().error('Set the start date — it drives the countdown and schedule'),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      group: 'details',
      description: 'When the conference ends. Must be after the start date. Used to calculate conference duration and close registration.',
      validation: (rule) =>
        rule.required().custom((endDate, context) => {
          const startDate = (context.document as any)?.startDate
          if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return 'End date must be after the start date'
          }
          return true
        }),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: [{ type: 'venue' }],
      group: 'venue',
      description: 'The primary venue for this conference. Rooms are defined on the venue document. Content Agent: use venue details (address, transit info) when answering attendee logistics questions.',
    }),
    defineField({
      name: 'tracks',
      title: 'Tracks',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'track' }] })],
      group: 'details',
      description: 'The conference tracks (e.g., "Frontend," "AI/ML," "Design Systems"). Tracks organize sessions into thematic streams. Order here determines display order on the schedule page.',
      validation: (rule) => rule.min(1).error('Add at least one track'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      options: { hotspot: true },
      description: 'Conference logo. Used in the site header, emails, and social cards. Upload an SVG or high-res PNG with transparent background.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Accessible description of the logo. Required for screen readers.',
          validation: (rule) => rule.required().error('Alt text is required for accessibility'),
        }),
      ],
    }),
    defineField({
      name: 'socialCard',
      title: 'Social Card Image',
      type: 'image',
      group: 'branding',
      description: 'The default Open Graph image (1200×630px). Shown when the site is shared on social media. Individual sessions and speakers can override this.',
    }),
    ...seoFields('seo'),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'tagline',
      startDate: 'startDate',
      media: 'logo',
    },
    prepare({ title, subtitle, startDate, media }) {
      return {
        title,
        subtitle: startDate
          ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${subtitle || ''}`
          : subtitle,
        media,
      }
    },
  },
})
```

---

### 2. `speaker`

People who present at the conference. Referenced by sessions, never embedded.

```ts
defineType({
  name: 'speaker',
  title: 'Speaker',
  type: 'document',
  icon: UserIcon,
  groups: [
    { name: 'profile', title: 'Profile', default: true },
    { name: 'social', title: 'Social & Links' },
    { name: 'logistics', title: 'Logistics' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      group: 'profile',
      description: 'The speaker\'s full name as they want it displayed. Used on speaker cards, session pages, and in email communications. Content Agent: use this exact name — don\'t abbreviate or modify.',
      validation: (rule) => rule.required().error('Speaker name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'profile',
      description: 'URL-friendly identifier for the speaker\'s profile page. Auto-generated from name.',
      options: { source: 'name' },
      validation: (rule) => rule.required().error('Generate a slug for the speaker profile URL'),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'profile',
      options: { hotspot: true },
      description: 'Professional headshot. Displayed on speaker cards (cropped to square) and profile pages. Use hotspot to set the focal point for cropping. Minimum 400×400px recommended.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Accessible description, e.g., "Headshot of Sarah Chen." Required for accessibility.',
          validation: (rule) => rule.required().error('Alt text is required for accessibility'),
        }),
      ],
      validation: (rule) => rule.required().error('Upload a speaker photo — it\'s displayed on cards and profile pages'),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      group: 'profile',
      description: 'The speaker\'s current job title, e.g., "Senior Engineer at Vercel." Displayed below their name on speaker cards. Content Agent: include this in generated bios and social announcements.',
      validation: (rule) => rule.required().error('Add the speaker\'s role — it appears on their card'),
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      group: 'profile',
      description: 'The speaker\'s current company or organization. Displayed on speaker cards and used for filtering. If independent, use "Independent" or their consultancy name.',
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      group: 'profile',
      description: 'Speaker biography, 2-4 paragraphs. Displayed on the speaker profile page and talk detail pages. Should include current role, relevant expertise, and notable achievements. Content Agent: use this as the authoritative source for speaker background when generating introductions or social posts.',
      validation: (rule) => rule.required().error('Write a bio — it\'s the main content on the speaker profile page'),
    }),
    defineField({
      name: 'twitter',
      title: 'X (Twitter) Handle',
      type: 'string',
      group: 'social',
      description: 'Twitter/X handle without the @ symbol, e.g., "sarah_codes." Used for social links and Content Agent when generating social media announcements.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (value.startsWith('@')) return 'Enter the handle without the @ symbol'
          if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Handle can only contain letters, numbers, and underscores'
          return true
        }),
    }),
    defineField({
      name: 'github',
      title: 'GitHub Username',
      type: 'string',
      group: 'social',
      description: 'GitHub username, e.g., "sarahchen." Linked from the speaker profile page.',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'social',
      description: 'Full LinkedIn profile URL. Linked from the speaker profile page.',
      validation: (rule) =>
        rule.uri({ scheme: ['https'] }).error('Use the full LinkedIn URL starting with https://'),
    }),
    defineField({
      name: 'website',
      title: 'Personal Website',
      type: 'url',
      group: 'social',
      description: 'The speaker\'s personal website or blog. Linked from the speaker profile page.',
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https'] }).error('Enter a valid URL starting with http:// or https://'),
    }),
    defineField({
      name: 'travelStatus',
      title: 'Travel Status',
      type: 'string',
      group: 'logistics',
      description: 'Internal field for organizers. Tracks whether travel arrangements are confirmed. Not displayed on the website.',
      options: {
        list: [
          { title: 'Not Started', value: 'not-started' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'Booked', value: 'booked' },
          { title: 'N/A (Local)', value: 'local' },
        ],
        layout: 'radio',
      },
      initialValue: 'not-started',
    }),
    defineField({
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      group: 'logistics',
      rows: 3,
      description: 'Private notes for organizers — dietary requirements, AV needs, scheduling constraints. Never displayed publicly.',
    }),
    ...seoFields('seo'),
  ],
  orderings: [
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
    { title: 'Company', name: 'company', by: [{ field: 'company', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'name',
      role: 'role',
      company: 'company',
      media: 'photo',
    },
    prepare({ title, role, company, media }) {
      return {
        title,
        subtitle: [role, company].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
```

---

### 3. `session` (Unified — D-002)

The core content type. Covers keynotes, talks, panels, workshops, lightning talks, breaks, and social events via `sessionType` + conditional fields.

```ts
defineType({
  name: 'session',
  title: 'Session',
  type: 'document',
  icon: PresentationIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'speakers', title: 'Speakers' },
    { name: 'workshop', title: 'Workshop Details' },
    { name: 'scheduling', title: 'Scheduling' },
    { name: 'media', title: 'Media & Recordings' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Session Title',
      type: 'string',
      group: 'content',
      description: 'The title of this session as it appears on the schedule, session detail page, and in emails. Keep it concise and descriptive — under 80 characters works best for schedule grid cards. Content Agent: use this as the canonical session name.',
      validation: (rule) =>
        rule
          .required()
          .error('Every session needs a title')
          .max(120)
          .warning('Titles over 120 characters get truncated on schedule cards'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title' },
      description: 'URL-friendly identifier for the session detail page.',
      validation: (rule) => rule.required().error('Generate a slug for the session page URL'),
    }),
    defineField({
      name: 'sessionType',
      title: 'Session Type',
      type: 'string',
      group: 'content',
      description: 'The format of this session. Controls which fields are visible below. Keynotes get main stage priority, workshops show capacity and prerequisites, panels show a moderator field, breaks and socials hide speaker fields.',
      options: {
        list: [
          { title: 'Keynote', value: 'keynote' },
          { title: 'Talk', value: 'talk' },
          { title: 'Panel', value: 'panel' },
          { title: 'Workshop', value: 'workshop' },
          { title: 'Lightning Talk', value: 'lightning' },
          { title: 'Break', value: 'break' },
          { title: 'Social Event', value: 'social' },
        ],
        layout: 'radio',
      },
      initialValue: 'talk',
      validation: (rule) => rule.required().error('Select a session type'),
    }),
    defineField({
      name: 'abstract',
      title: 'Abstract',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      group: 'content',
      description: 'The session description displayed on the detail page and used in email announcements. For talks: 1-3 paragraphs covering what attendees will learn. For workshops: include what participants will build. Content Agent: use this as the primary source when summarizing sessions or answering "what is this talk about?"',
      hidden: ({ document }) => ['break'].includes(document?.sessionType as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as any)?.sessionType
          if (['break', 'social'].includes(type)) return true
          if (!value || value.length === 0) return 'Add an abstract — it\'s the main content on the session page'
          return true
        }),
    }),
    defineField({
      name: 'track',
      title: 'Track',
      type: 'reference',
      to: [{ type: 'track' }],
      group: 'content',
      description: 'Which conference track this session belongs to (e.g., "Frontend," "AI/ML"). Determines the color coding on the schedule grid and enables track-based filtering.',
      hidden: ({ document }) => ['break', 'social'].includes(document?.sessionType as string),
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      group: 'content',
      description: 'The experience level this session targets. Displayed as a badge on session cards. Helps attendees choose appropriate sessions. Content Agent: mention the level when recommending sessions to attendees.',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
        layout: 'radio',
      },
      hidden: ({ document }) => ['break', 'social'].includes(document?.sessionType as string),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      group: 'scheduling',
      description: 'Session length in minutes. Used for schedule grid layout and calendar exports. Typical values: keynote 45-60, talk 30, lightning 10, workshop 120-180, break 15-30.',
      validation: (rule) =>
        rule
          .required()
          .min(5)
          .max(480)
          .error('Duration must be between 5 and 480 minutes'),
      initialValue: 30,
    }),

    // --- Speaker fields (hidden for breaks/socials) ---
    defineField({
      name: 'speakers',
      title: 'Speakers',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'speaker' }] })],
      group: 'speakers',
      description: 'The speaker(s) presenting this session. For panels, add all panelists here (minimum 2) and set the moderator separately. For workshops, these are the instructors. Order determines display order. Content Agent: list speakers by name when describing sessions.',
      hidden: ({ document }) => ['break', 'social'].includes(document?.sessionType as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as any)?.sessionType
          if (['break', 'social'].includes(type)) return true
          if (!value || value.length === 0) return 'Add at least one speaker'
          if (type === 'panel' && value.length < 2) return 'Panels need at least two panelists'
          return true
        }),
    }),
    defineField({
      name: 'moderator',
      title: 'Moderator',
      type: 'reference',
      to: [{ type: 'speaker' }],
      group: 'speakers',
      description: 'The panel moderator — required for panels. Should be someone different from the panelists listed in Speakers. Only visible for panel sessions.',
      hidden: ({ document }) => document?.sessionType !== 'panel',
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as any)?.sessionType
          if (type !== 'panel') return true
          if (!value) return 'Panels need a moderator — select the person leading the discussion'
          return true
        }),
    }),

    // --- Workshop-specific fields ---
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      group: 'workshop',
      description: 'Maximum number of participants. Displayed on the session card and used for registration limits. Only relevant for workshops and social events with limited space.',
      hidden: ({ document }) => !['workshop', 'social'].includes(document?.sessionType as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as any)?.sessionType
          if (type === 'workshop' && (!value || value < 1)) {
            return 'Workshops need a capacity limit for registration'
          }
          return true
        }),
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'text',
      group: 'workshop',
      rows: 3,
      description: 'What attendees should know or bring before attending this workshop. Displayed on the session detail page. E.g., "Laptop with Node.js 18+ installed. Basic React knowledge assumed." Content Agent: mention prerequisites when recommending workshops.',
      hidden: ({ document }) => document?.sessionType !== 'workshop',
    }),
    defineField({
      name: 'materials',
      title: 'Materials & Resources',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'material',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url', validation: (rule) => rule.required() }),
            defineField({
              name: 'type',
              type: 'string',
              options: {
                list: [
                  { title: 'GitHub Repo', value: 'repo' },
                  { title: 'Slides', value: 'slides' },
                  { title: 'Documentation', value: 'docs' },
                  { title: 'Other', value: 'other' },
                ],
              },
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'type' },
          },
        }),
      ],
      group: 'workshop',
      description: 'Links to workshop materials — GitHub repos, slides, documentation. Made available to registered attendees before and after the workshop.',
      hidden: ({ document }) => document?.sessionType !== 'workshop',
    }),

    // --- Media & Recordings ---
    defineField({
      name: 'slidesUrl',
      title: 'Slides URL',
      type: 'url',
      group: 'media',
      description: 'Link to the presentation slides (Speaker Deck, Google Slides, etc.). Added after the talk and displayed on the session detail page.',
      hidden: ({ document }) => ['break', 'social'].includes(document?.sessionType as string),
    }),
    defineField({
      name: 'recordingUrl',
      title: 'Recording URL',
      type: 'url',
      group: 'media',
      description: 'Link to the session recording (YouTube, Vimeo, etc.). Added post-conference. Displayed prominently on the session detail page.',
      hidden: ({ document }) => ['break', 'social'].includes(document?.sessionType as string),
    }),

    ...seoFields('seo'),
  ],
  orderings: [
    { title: 'Title A-Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
    { title: 'Type', name: 'type', by: [{ field: 'sessionType', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      sessionType: 'sessionType',
      speaker0Name: 'speakers.0.name',
      speaker1Name: 'speakers.1.name',
      trackTitle: 'track.name',
    },
    prepare({ title, sessionType, speaker0Name, speaker1Name, trackTitle }) {
      const typeLabel = sessionType ? sessionType.charAt(0).toUpperCase() + sessionType.slice(1) : ''
      const speakers = [speaker0Name, speaker1Name].filter(Boolean)
      const speakerText = speakers.length > 1 ? `${speakers[0]} +${speakers.length - 1}` : speakers[0] || ''
      return {
        title,
        subtitle: [typeLabel, speakerText, trackTitle].filter(Boolean).join(' · '),
      }
    },
  },
})
```

---

### 4. `scheduleSlot`

The join document that places a session in time and space. Session = what/who. Slot = when/where.

```ts
defineType({
  name: 'scheduleSlot',
  title: 'Schedule Slot',
  type: 'document',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'session',
      title: 'Session',
      type: 'reference',
      to: [{ type: 'session' }],
      description: 'The session assigned to this time slot. One session can only occupy one slot (no double-booking). Content Agent: when answering "when is [talk]?", look up the slot for that session.',
      validation: (rule) =>
        rule.required().error('Assign a session to this slot').custom(async (value, context) => {
          if (!value?._ref) return true
          const client = context.getClient({ apiVersion: '2025-11-01' })
          const id = context.document?._id?.replace(/^drafts\./, '')
          const existing = await client.fetch(
            `count(*[_type == "scheduleSlot" && session._ref == $ref && _id != $id && !(_id in path("drafts.**"))])`,
            { ref: value._ref, id }
          )
          return existing === 0 || 'This session is already assigned to another time slot'
        }),
    }),
    defineField({
      name: 'conference',
      title: 'Conference',
      type: 'reference',
      to: [{ type: 'conference' }],
      description: 'Which conference this slot belongs to. Enables multi-conference support and scopes schedule queries.',
      validation: (rule) => rule.required().error('Select the conference'),
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'datetime',
      description: 'When this session begins. Used for schedule grid positioning, calendar exports, and "happening now" indicators. Content Agent: use this to answer "what time is [talk]?"',
      validation: (rule) => rule.required().error('Set the start time'),
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'datetime',
      description: 'When this session ends. Must be after start time. Auto-calculated from session duration if left empty (future enhancement).',
      validation: (rule) =>
        rule.required().custom((endTime, context) => {
          const startTime = (context.document as any)?.startTime
          if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
            return 'End time must be after start time'
          }
          return true
        }),
    }),
    defineField({
      name: 'room',
      title: 'Room',
      type: 'reference',
      to: [{ type: 'room' }],
      description: 'Which room this session takes place in. Displayed on the schedule grid and session detail page. Content Agent: use this to answer "where is [talk]?"',
      validation: (rule) => rule.required().error('Assign a room'),
    }),
    defineField({
      name: 'isPlenary',
      title: 'Plenary Session',
      type: 'boolean',
      description: 'If true, this session spans all tracks (keynotes, breaks, socials). Displayed as a full-width row on the schedule grid instead of in a single track column.',
      initialValue: false,
    }),
  ],
  // Double-booking validation — the showcase moment.
  // Warns (not errors) when a room+time collision exists, because organizers
  // might intentionally overlap for setup or transition periods.
  validation: (rule) =>
    rule.custom(async (doc, context) => {
      if (!doc?.room?._ref || !doc?.startTime || !doc?.endTime) return true

      const client = context.getClient({ apiVersion: '2025-11-01' })
      const id = doc._id?.replace(/^drafts\./, '')

      const conflicts = await client.fetch(
        `*[_type == "scheduleSlot"
          && room._ref == $roomRef
          && _id != $id
          && !(_id in path("drafts.**"))
          && startTime < $endTime
          && endTime > $startTime
        ]{ session->{ title } }`,
        {
          roomRef: doc.room._ref,
          id,
          startTime: doc.startTime,
          endTime: doc.endTime,
        }
      )

      if (conflicts.length > 0) {
        const titles = conflicts.map((c: any) => c.session?.title || 'Untitled').join(', ')
        return {
          message: `⚠️ This room already has "${titles}" scheduled during this time. Double-check for conflicts.`,
          level: 'warning',
        } as any
      }
      return true
    }),
  orderings: [
    { title: 'Start Time', name: 'startTime', by: [{ field: 'startTime', direction: 'asc' }] },
  ],
  preview: {
    select: {
      sessionTitle: 'session.title',
      startTime: 'startTime',
      roomName: 'room.name',
    },
    prepare({ sessionTitle, startTime, roomName }) {
      const time = startTime
        ? new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'Unscheduled'
      return {
        title: sessionTitle || 'Empty Slot',
        subtitle: `${time} · ${roomName || 'No room'}`,
      }
    },
  },
})
```

---

### 5. `track`

Thematic streams that organize sessions.

```ts
defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Track Name',
      type: 'string',
      description: 'The track name, e.g., "Frontend," "AI/ML," "Design Systems." Displayed as column headers on the schedule grid and as filter chips on the session listing. Content Agent: use track names when categorizing or recommending sessions.',
      validation: (rule) => rule.required().error('Track name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'name' },
      description: 'URL-friendly identifier. Used for track filter URLs like /schedule?track=frontend.',
      validation: (rule) => rule.required().error('Generate a slug for track filtering'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'A 1-2 sentence description of what this track covers. Displayed on the schedule page when a track filter is active. Content Agent: use this to explain what kinds of sessions belong to this track.',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'color',
      description: 'The accent color for this track. Used for schedule grid column headers, session card borders, and track badges. Pick a color that\'s accessible against white backgrounds.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the left-to-right order of tracks on the schedule grid. Lower numbers appear first.',
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'description' },
  },
})
```

---

### 6. `venue`

The physical location with nested rooms.

```ts
defineType({
  name: 'venue',
  title: 'Venue',
  type: 'document',
  icon: PinIcon,
  groups: [
    { name: 'info', title: 'Information', default: true },
    { name: 'logistics', title: 'Logistics' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Venue Name',
      type: 'string',
      group: 'info',
      description: 'The official venue name, e.g., "Javits Center." Displayed on the venue page and in email footers. Content Agent: use this when answering location questions.',
      validation: (rule) => rule.required().error('Venue name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'info',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      group: 'info',
      rows: 2,
      description: 'Full street address. Displayed on the venue page and used for map embeds. Content Agent: provide this when attendees ask for directions.',
      validation: (rule) => rule.required().error('Add the venue address'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'image', options: { hotspot: true } })],
      group: 'info',
      description: 'Venue overview with photos. Displayed on the venue page. Include information about the space, atmosphere, and any notable features.',
    }),
    defineField({
      name: 'mapUrl',
      title: 'Map URL',
      type: 'url',
      group: 'info',
      description: 'Google Maps or Apple Maps link. Opens in a new tab when attendees click "Get Directions."',
    }),
    defineField({
      name: 'transitInfo',
      title: 'Transit Information',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      group: 'logistics',
      description: 'How to get to the venue — subway lines, bus routes, parking, bike racks. Displayed on the venue page. Content Agent: use this to answer "how do I get to the venue?"',
    }),
    defineField({
      name: 'wifiInfo',
      title: 'WiFi Information',
      type: 'object',
      group: 'logistics',
      description: 'WiFi network details for attendees. Content Agent: provide this when attendees ask about WiFi.',
      fields: [
        defineField({ name: 'network', title: 'Network Name', type: 'string' }),
        defineField({ name: 'password', title: 'Password', type: 'string' }),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Venue Photo',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      description: 'Primary venue photo. Used as the hero image on the venue page and in social cards.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().error('Alt text is required'),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'address', media: 'image' },
  },
})
```

---

### 7. `room`

Individual rooms within a venue. Separate document type (not nested) so schedule slots can reference them directly.

```ts
defineType({
  name: 'room',
  title: 'Room',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Room Name',
      type: 'string',
      description: 'The room name as displayed on the schedule grid and session detail pages, e.g., "Main Hall," "Workshop Room A." Content Agent: use this when answering "where is [session]?"',
      validation: (rule) => rule.required().error('Room name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'name' },
      description: 'URL-friendly identifier. Enables room detail pages with floor maps, amenities, and "sessions in this room" listings.',
      validation: (rule) => rule.required().error('Generate a slug for the room page URL'),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: [{ type: 'venue' }],
      description: 'Which venue this room belongs to. Enables venue-scoped room listings.',
      validation: (rule) => rule.required().error('Select the venue this room belongs to'),
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      description: 'Maximum seating capacity. Used for scheduling validation — workshops shouldn\'t be assigned to rooms smaller than their capacity. Displayed on the venue page.',
      validation: (rule) => rule.min(1).error('Capacity must be at least 1'),
    }),
    defineField({
      name: 'floor',
      title: 'Floor',
      type: 'string',
      description: 'Which floor the room is on, e.g., "2nd Floor," "Mezzanine." Helps attendees navigate the venue.',
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Available equipment and features, e.g., "Projector," "Whiteboard," "Power outlets at every seat." Helps organizers assign sessions to appropriate rooms.',
      options: {
        list: [
          { title: 'Projector', value: 'projector' },
          { title: 'Whiteboard', value: 'whiteboard' },
          { title: 'Power Outlets', value: 'power' },
          { title: 'Video Recording', value: 'recording' },
          { title: 'Livestream', value: 'livestream' },
          { title: 'Wheelchair Accessible', value: 'accessible' },
          { title: 'Hearing Loop', value: 'hearing-loop' },
        ],
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the display order in room listings. Lower numbers appear first.',
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', venueName: 'venue.name', capacity: 'capacity' },
    prepare({ title, venueName, capacity }) {
      return {
        title,
        subtitle: [venueName, capacity ? `${capacity} seats` : null].filter(Boolean).join(' · '),
      }
    },
  },
})
```

---

### 8. `sponsor`

Companies sponsoring the conference, organized by tier.

```ts
defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Company Name',
      type: 'string',
      description: 'The sponsor\'s company name. Displayed on the sponsor page and in the homepage sponsor bar. Content Agent: use this when listing sponsors or answering "who is sponsoring?"',
      validation: (rule) => rule.required().error('Sponsor name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Sponsorship Tier',
      type: 'string',
      description: 'The sponsorship level. Determines logo size and placement on the sponsor page. Platinum sponsors get the largest logos and top placement.',
      options: {
        list: [
          { title: 'Platinum', value: 'platinum' },
          { title: 'Gold', value: 'gold' },
          { title: 'Silver', value: 'silver' },
          { title: 'Bronze', value: 'bronze' },
          { title: 'Community', value: 'community' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Select a sponsorship tier'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Company logo. Upload an SVG or high-res PNG with transparent background. Displayed on the sponsor page and homepage sponsor bar.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().error('Alt text is required'),
        }),
      ],
      validation: (rule) => rule.required().error('Upload the sponsor logo'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      description: 'A short description of the sponsor and what they do. Displayed on the sponsor detail section. Content Agent: use this when attendees ask about a sponsor.',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      description: 'The sponsor\'s website. Linked from their logo on the sponsor page.',
      validation: (rule) => rule.uri({ scheme: ['https'] }).error('Use the full URL starting with https://'),
    }),
    defineField({
      name: 'order',
      title: 'Display Order (within tier)',
      type: 'number',
      description: 'Controls the order within the same tier. Lower numbers appear first. Sponsors in higher tiers always appear above lower tiers.',
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: 'Tier → Order', name: 'tierOrder', by: [{ field: 'tier', direction: 'asc' }, { field: 'order', direction: 'asc' }] },
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', tier: 'tier', media: 'logo' },
    prepare({ title, tier, media }) {
      return {
        title,
        subtitle: tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '',
        media,
      }
    },
  },
})
```

---

### 9. `page`

Flexible marketing pages built with modular sections.

```ts
defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      group: 'content',
      description: 'The page title displayed in the browser tab and as the H1 heading. Content Agent: use this as the canonical page name.',
      validation: (rule) => rule.required().error('Page title is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title' },
      description: 'The URL path for this page, e.g., "about" becomes /about.',
      validation: (rule) => rule.required().error('Generate a slug for the page URL'),
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({ type: 'hero' }),
        defineArrayMember({ type: 'richText' }),
        defineArrayMember({ type: 'speakerGrid' }),
        defineArrayMember({ type: 'sponsorBar' }),
        defineArrayMember({ type: 'schedulePreview' }),
        defineArrayMember({ type: 'ctaBlock' }),
        defineArrayMember({ type: 'faqSection' }),
      ],
      description: 'Build the page by adding and reordering sections. Each section type has its own fields and layout. Visual Editing: click any section on the preview to edit it directly.',
    }),
    ...seoFields('seo'),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }) {
      return { title, subtitle: slug ? `/${slug}` : '' }
    },
  },
})
```

---

### 10. `announcement`

Blog posts and news updates about the conference.

```ts
defineType({
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  icon: BellIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'The announcement headline. Displayed on the announcements listing and detail page. Content Agent: use this when summarizing recent news.',
      validation: (rule) => rule.required().error('Announcement title is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      group: 'content',
      description: 'When this announcement was published. Used for sorting and display. Can be set to a future date for scheduled publishing via Content Releases. Note: auto-fills to "now" on creation — editors working in a Content Release should adjust this to the intended publish date, not the drafting date.',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 3,
      description: 'A 1-2 sentence summary displayed on the announcements listing page and in social previews. Keep it under 200 characters for best results.',
      validation: (rule) => rule.max(200).warning('Excerpts work best under 200 characters'),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({ type: 'image', options: { hotspot: true } }),
      ],
      group: 'content',
      description: 'The full announcement content. Supports rich text and images.',
      validation: (rule) => rule.required().error('Write the announcement body'),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Featured image displayed at the top of the announcement and in social cards.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().error('Alt text is required'),
        }),
      ],
    }),
    ...seoFields('seo'),
  ],
  orderings: [
    { title: 'Newest First', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', publishedAt: 'publishedAt', media: 'coverImage' },
    prepare({ title, publishedAt, media }) {
      return {
        title,
        subtitle: publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft',
        media,
      }
    },
  },
})
```

---

## Object Types (Page Builder Sections)

These are the building blocks for the `page` document's `sections` array.

### `hero`
```ts
defineType({
  name: 'hero',
  title: 'Hero Section',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The main hero heading. Keep it short and impactful — this is the first thing visitors see.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
      description: 'Supporting text below the heading. 1-2 sentences that expand on the heading.',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-width background image. Use hotspot to control the focal point.',
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
      description: 'Primary action button displayed in the hero.',
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare({ title }) {
      return { title: title || 'Hero Section', subtitle: 'Hero' }
    },
  },
})
```

### `richText`
```ts
defineType({
  name: 'richText',
  title: 'Rich Text Section',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      description: 'Optional heading displayed above the text content.',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'image', options: { hotspot: true } })],
      description: 'Rich text content with optional images.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare({ title }) {
      return { title: title || 'Rich Text', subtitle: 'Text Section' }
    },
  },
})
```

### `speakerGrid`
```ts
defineType({
  name: 'speakerGrid',
  title: 'Speaker Grid',
  type: 'object',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Section heading, e.g., "Featured Speakers" or "Our Speakers."',
    }),
    defineField({
      name: 'speakers',
      title: 'Speakers',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'speaker' }] })],
      description: 'Select specific speakers to feature. Leave empty to show all speakers. Order here determines display order.',
    }),
    defineField({
      name: 'limit',
      title: 'Max Speakers to Show',
      type: 'number',
      description: 'Limit the number of speakers displayed. Useful for homepage previews. Leave empty to show all.',
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare({ title }) {
      return { title: title || 'Speaker Grid', subtitle: 'Speakers' }
    },
  },
})
```

### `sponsorBar`
```ts
defineType({
  name: 'sponsorBar',
  title: 'Sponsor Bar',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Section heading, e.g., "Our Sponsors" or "Supported By."',
    }),
    defineField({
      name: 'tiers',
      title: 'Tiers to Show',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Platinum', value: 'platinum' },
          { title: 'Gold', value: 'gold' },
          { title: 'Silver', value: 'silver' },
          { title: 'Bronze', value: 'bronze' },
          { title: 'Community', value: 'community' },
        ],
      },
      description: 'Which sponsor tiers to display. Leave empty to show all tiers.',
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare({ title }) {
      return { title: title || 'Sponsor Bar', subtitle: 'Sponsors' }
    },
  },
})
```

### `schedulePreview`
```ts
defineType({
  name: 'schedulePreview',
  title: 'Schedule Preview',
  type: 'object',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Section heading, e.g., "Schedule Highlights" or "What\'s On."',
    }),
    defineField({
      name: 'day',
      title: 'Day to Preview',
      type: 'date',
      description: 'Show schedule slots for this specific day. Leave empty to show the first conference day.',
    }),
    defineField({
      name: 'maxSlots',
      title: 'Max Slots to Show',
      type: 'number',
      description: 'Limit the number of slots displayed. Useful for homepage teasers.',
      initialValue: 6,
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare({ title }) {
      return { title: title || 'Schedule Preview', subtitle: 'Schedule' }
    },
  },
})
```

### `ctaBlock`
```ts
defineType({
  name: 'ctaBlock',
  title: 'Call to Action Block',
  type: 'object',
  icon: LaunchIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The CTA heading, e.g., "Ready to Join?" or "Get Your Tickets."',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body Text',
      type: 'text',
      rows: 2,
      description: 'Supporting text below the heading.',
    }),
    defineField({
      name: 'cta',
      title: 'Button',
      type: 'cta',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare({ title }) {
      return { title: title || 'CTA Block', subtitle: 'Call to Action' }
    },
  },
})
```

### `faqSection`
```ts
defineType({
  name: 'faqSection',
  title: 'FAQ Section',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Section heading, e.g., "Frequently Asked Questions."',
    }),
    defineField({
      name: 'items',
      title: 'FAQ Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              description: 'The question as attendees would ask it. Content Agent: use these Q&A pairs to answer attendee questions directly.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'array',
              of: [defineArrayMember({ type: 'block' })],
              description: 'The answer. Keep it concise — 1-3 sentences is ideal.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: 'question' },
          },
        }),
      ],
      description: 'Question and answer pairs. Also used for JSON-LD FAQ structured data (SEO) and as a knowledge source for the AI concierge.',
    }),
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare({ title, items }) {
      return {
        title: title || 'FAQ Section',
        subtitle: items ? `${items.length} questions` : 'No questions yet',
      }
    },
  },
})
```

---

## Shared Object Types

### `cta` (Call to Action)
```ts
defineType({
  name: 'cta',
  title: 'Call to Action',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button Label',
      type: 'string',
      description: 'The button text, e.g., "Register Now," "View Schedule." Keep it action-oriented and under 30 characters.',
      validation: (rule) => rule.required().max(30).error('Button labels should be under 30 characters'),
    }),
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: { list: ['internal', 'external'], layout: 'radio' },
      initialValue: 'external',
    }),
    defineField({
      name: 'internalLink',
      title: 'Internal Page',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'session' }, { type: 'speaker' }],
      hidden: ({ parent }) => parent?.linkType !== 'internal',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({ parent }) => parent?.linkType !== 'external',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'style',
      title: 'Button Style',
      type: 'string',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'Ghost', value: 'ghost' },
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
  ],
})
```

### `seoFields` (Shared field helper)
```ts
// schemas/shared/seoFields.ts
export const seoFields = (group: string) => [
  defineField({
    name: 'seoTitle',
    title: 'SEO Title',
    type: 'string',
    group,
    description: 'Custom title for search engines and social sharing. Falls back to the document title if empty. Keep under 60 characters for best display in search results.',
    validation: (rule) => rule.max(60).warning('SEO titles over 60 characters get truncated in search results'),
  }),
  defineField({
    name: 'seoDescription',
    title: 'SEO Description',
    type: 'text',
    group,
    rows: 3,
    description: 'Meta description for search engines. Displayed below the title in search results. Keep between 120-160 characters. Content Agent: generate this from the main content if empty.',
    validation: (rule) =>
      rule
        .max(160)
        .warning('Meta descriptions over 160 characters get truncated in search results'),
  }),
  defineField({
    name: 'ogImage',
    title: 'Social Share Image',
    type: 'image',
    group,
    description: 'Custom Open Graph image (1200×630px) for social sharing. Falls back to the conference default if empty.',
  }),
]
```

---

## GROQ Query Patterns

### The Litmus Test: Schedule Page Query

This is the query that proves the model works. One query, no N+1, all the data the schedule grid needs:

```groq
// SCHEDULE_DAY_QUERY — Fetch all slots for a given day
*[_type == "scheduleSlot"
  && conference._ref == $conferenceId
  && startTime >= $dayStart
  && startTime < $dayEnd
] | order(startTime asc) {
  _id,
  startTime,
  endTime,
  isPlenary,
  room->{
    _id,
    name,
    capacity,
    floor
  },
  session->{
    _id,
    title,
    "slug": slug.current,
    sessionType,
    level,
    duration,
    track->{
      _id,
      name,
      "slug": slug.current,
      color
    },
    speakers[]->{
      _id,
      name,
      "slug": slug.current,
      photo,
      role,
      company
    },
    moderator->{
      _id,
      name,
      "slug": slug.current
    }
  }
}
```

**Result:** Flat array of slots, each with fully resolved session → track, session → speakers, and slot → room. One query. Zero N+1.

### Speaker Profile with Sessions

```groq
// SPEAKER_DETAIL_QUERY
*[_type == "speaker" && slug.current == $slug][0] {
  _id,
  name,
  "slug": slug.current,
  photo { ..., alt },
  role,
  company,
  bio,
  twitter,
  github,
  linkedin,
  website,
  "sessions": *[_type == "session" && references(^._id)] {
    _id,
    title,
    "slug": slug.current,
    sessionType,
    level,
    track->{ name, color },
    "slot": *[_type == "scheduleSlot" && session._ref == ^._id][0] {
      startTime,
      endTime,
      room->{ name }
    }
  }
}
```

### All Speakers

```groq
// SPEAKERS_QUERY
*[_type == "speaker"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  photo { ..., alt },
  role,
  company,
  "sessionCount": count(*[_type == "session" && references(^._id)])
}
```

### Sessions by Track

```groq
// SESSIONS_BY_TRACK_QUERY
*[_type == "session" && track->slug.current == $trackSlug] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  sessionType,
  level,
  speakers[]->{ _id, name, "slug": slug.current, photo { ..., alt } },
  "slot": *[_type == "scheduleSlot" && session._ref == ^._id][0] {
    startTime,
    endTime,
    room->{ name }
  }
}
```

### Sponsors by Tier

```groq
// SPONSORS_QUERY
*[_type == "sponsor"] | order(tier asc, order asc) {
  _id,
  name,
  "slug": slug.current,
  tier,
  logo { ..., alt },
  website,
  description
}
```

### Page with Sections (Page Builder)

```groq
// PAGE_QUERY
*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  seoTitle,
  seoDescription,
  ogImage,
  sections[] {
    ...,
    _type == "speakerGrid" => {
      ...,
      speakers[]->{ _id, name, "slug": slug.current, photo, role, company }
    },
    _type == "schedulePreview" => {
      ...,
      // Note: $previewDayStart and $previewDayEnd should be pre-computed
      // from the section's `day` field on the frontend. String concatenation
      // in GROQ filters is not optimizable — use params instead.
      "slots": *[_type == "scheduleSlot"
        && conference._ref == $conferenceId
        && startTime >= $previewDayStart
        && startTime < $previewDayEnd
      ] | order(startTime asc) [0...coalesce(^.maxSlots, 6)] {
        startTime,
        session->{ title, "slug": slug.current, sessionType, speakers[]->{ name, photo { ..., alt } } },
        room->{ name }
      }
    }
  }
}
```

---

## Schema File Structure

## Plugin Dependencies

The following Studio plugins are required by this schema:

| Plugin | Used By | Purpose |
|--------|---------|---------|
| `@sanity/color-input` | `track.color` | Color picker for track accent colors on the schedule grid |

Install in the Studio app: `pnpm add @sanity/color-input` and register in `sanity.config.ts`.

## seoFields TypeGen Note

The `...seoFields('seo')` spread pattern needs Sprint 0 verification with TypeGen. If `sanity typegen` can't trace through the helper function to infer field types, `seoTitle`, `seoDescription`, and `ogImage` will resolve to `any` across 5 document types. **Fallback:** inline the fields directly on each type. @forger — flag this in Sprint 0 scaffold.

```
packages/sanity-schema/
├── index.ts                    # Schema registry (exports all types)
├── schemas/
│   ├── documents/
│   │   ├── conference.ts
│   │   ├── speaker.ts
│   │   ├── session.ts
│   │   ├── scheduleSlot.ts
│   │   ├── track.ts
│   │   ├── venue.ts
│   │   ├── room.ts
│   │   ├── sponsor.ts
│   │   ├── page.ts
│   │   └── announcement.ts
│   ├── objects/
│   │   ├── hero.ts
│   │   ├── richText.ts
│   │   ├── speakerGrid.ts
│   │   ├── sponsorBar.ts
│   │   ├── schedulePreview.ts
│   │   ├── ctaBlock.ts
│   │   ├── faqSection.ts
│   │   └── cta.ts
│   └── shared/
│       └── seoFields.ts
```

---

## Sprint 3+ Document Types (Deferred)

These types are needed for later sprints but are documented here for completeness:

| Type | Sprint | Purpose |
|------|--------|---------|
| `attendee` | Sprint 3 | Luma registration sync — name, email, ticket type, Luma guest ID, dietary preferences |
| `ticketType` | Sprint 3 | Ticket definitions synced to Luma — name, price, capacity, validity dates, tier |
| `emailTemplate` | Sprint 4 | Email content authored in Studio — subject, Portable Text body, audience segment, trigger |
| `bulkOperationLog` | Sprint 5 | Tracks AI/bulk operations — who, what, when, estimated cost (D-008 guardrails) |

These will be specced in detail when their sprints begin. The core 10 types above are what Sprint 1 needs.

---

## Visual Editing Notes (D-014)

Every document type in this model supports Visual Editing. The guiding principle: **stega by default, fix gaps later.**

- **Text fields** (string, text, Portable Text) — automatic stega encoding via `next-sanity`. This includes referenced text rendered as strings (e.g., `speaker->name`, `track->name`, `room->name`). CSM/stega handles these automatically — no manual work needed.
- **Images** — `createDataAttribute` for click-to-edit on image containers (stega can't encode into binary data)
- **Non-text fields** — `createDataAttribute` for wrapper divs around non-string content (color swatches, boolean indicators, etc.)
- **Page builder sections** — each section gets `data-sanity` attributes via `_key`
- **Schedule grid** — the densest case, but mostly text: clicking a speaker name in a slot opens the speaker document (stega), clicking the session title opens the session (stega), clicking the room name opens the room (stega). Only images and non-text elements need manual attributes.

The model's reference-heavy design actually *helps* Visual Editing — most referenced content is rendered as text (names, titles, descriptions), which stega handles automatically. The 80/20 rule applies: ~80% of Visual Editing works out of the box, the remaining ~20% (images, custom components) gets `createDataAttribute`.

---

## Content Releases Considerations

Per D-013 and @sentinel's analysis, this reference-heavy model requires careful release management:

- **"Speaker Wave" release:** Adding 5 speakers + their sessions requires adding all 10+ documents to the release. The Release Dependency Resolver tool (specced separately) auto-walks `_ref` fields to catch missing dependencies.
- **"Schedule Reveal" release:** Schedule slots reference sessions, rooms, and the conference. All must be in the release or already published.
- **Dangling draft detection:** The resolver blocks publishing when a release contains documents that reference unpublished drafts not in the release.

The model's explicit references (no embedded data) make dependency walking reliable — every relationship is a `_ref` that can be programmatically traversed.
