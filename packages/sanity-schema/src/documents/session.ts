import {defineArrayMember, defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons'
import {seoFields} from '../shared/seoFields'

export const session = defineType({
  name: 'session',
  title: 'Session',
  type: 'document',
  description:
    'A conference session: talk, keynote, panel, workshop, lightning talk, break, or social event.',
  icon: PresentationIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'speakers', title: 'Speakers'},
    {name: 'workshop', title: 'Workshop Details'},
    {name: 'scheduling', title: 'Scheduling'},
    {name: 'media', title: 'Media & Recordings'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Session Title',
      type: 'string',
      group: 'content',
      description:
        'The title of this session as it appears on the schedule, session detail page, and in emails. Keep it concise and descriptive — under 80 characters works best for schedule grid cards. Content Agent: use this as the canonical session name.',
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
      options: {source: 'title'},
      description: 'URL-friendly identifier for the session detail page.',
      validation: (rule) => rule.required().error('Generate a slug for the session page URL'),
    }),
    defineField({
      name: 'sessionType',
      title: 'Session Type',
      type: 'string',
      group: 'content',
      description:
        'The format of this session. Controls which fields are visible below. Keynotes get main stage priority, workshops show capacity and prerequisites, panels show a moderator field, breaks and socials hide speaker fields.',
      options: {
        list: [
          {title: 'Keynote', value: 'keynote'},
          {title: 'Talk', value: 'talk'},
          {title: 'Panel', value: 'panel'},
          {title: 'Workshop', value: 'workshop'},
          {title: 'Lightning Talk', value: 'lightning'},
          {title: 'Break', value: 'break'},
          {title: 'Social Event', value: 'social'},
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
      of: [defineArrayMember({type: 'block'})],
      group: 'content',
      description:
        'The session description displayed on the detail page and used in email announcements. For talks: 1-3 paragraphs covering what attendees will learn. For workshops: include what participants will build. Content Agent: use this as the primary source when summarizing sessions or answering "what is this talk about?"',
      hidden: ({document}) => ['break'].includes(document?.sessionType as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as Record<string, unknown>)?.sessionType
          if (['break', 'social'].includes(type as string)) return true
          if (!value || (value as unknown[]).length === 0)
            return "Add an abstract — it's the main content on the session page"
          return true
        }),
    }),
    defineField({
      name: 'track',
      title: 'Track',
      type: 'reference',
      to: [{type: 'track'}],
      group: 'content',
      description:
        'Which conference track this session belongs to (e.g., "Frontend," "AI/ML"). Determines the color coding on the schedule grid and enables track-based filtering.',
      hidden: ({document}) =>
        ['break', 'social'].includes(document?.sessionType as string),
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      group: 'content',
      description:
        'The experience level this session targets. Displayed as a badge on session cards. Helps attendees choose appropriate sessions. Content Agent: mention the level when recommending sessions to attendees.',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
        layout: 'radio',
      },
      hidden: ({document}) =>
        ['break', 'social'].includes(document?.sessionType as string),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      group: 'scheduling',
      description:
        'Session length in minutes. Used for schedule grid layout and calendar exports. Typical values: keynote 45-60, talk 30, lightning 10, workshop 120-180, break 15-30.',
      validation: (rule) =>
        rule.required().min(5).max(480).error('Duration must be between 5 and 480 minutes'),
      initialValue: 30,
    }),

    // --- Speaker fields (hidden for breaks/socials) ---
    defineField({
      name: 'speakers',
      title: 'Speakers',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'person'}]})],
      group: 'speakers',
      description:
        'The speaker(s) presenting this session. For panels, add all panelists here (minimum 2) and set the moderator separately. For workshops, these are the instructors. Order determines display order. Content Agent: list speakers by name when describing sessions.',
      hidden: ({document}) =>
        ['break', 'social'].includes(document?.sessionType as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as Record<string, unknown>)?.sessionType
          if (['break', 'social'].includes(type as string)) return true
          if (!value || (value as unknown[]).length === 0) return 'Add at least one speaker'
          if (type === 'panel' && (value as unknown[]).length < 2)
            return 'Panels need at least two panelists'
          return true
        }),
    }),
    defineField({
      name: 'moderator',
      title: 'Moderator',
      type: 'reference',
      to: [{type: 'person'}],
      group: 'speakers',
      description:
        'The panel moderator — required for panels. Should be someone different from the panelists listed in Speakers. Only visible for panel sessions.',
      hidden: ({document}) => document?.sessionType !== 'panel',
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as Record<string, unknown>)?.sessionType
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
      description:
        'Maximum number of participants. Displayed on the session card and used for registration limits. Only relevant for workshops and social events with limited space.',
      hidden: ({document}) =>
        !['workshop', 'social'].includes(document?.sessionType as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = (context.document as Record<string, unknown>)?.sessionType
          if (type === 'workshop' && (!value || (value as number) < 1)) {
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
      description:
        'What attendees should know or bring before attending this workshop. Displayed on the session detail page. E.g., "Laptop with Node.js 18+ installed. Basic React knowledge assumed." Content Agent: mention prerequisites when recommending workshops.',
      hidden: ({document}) => document?.sessionType !== 'workshop',
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
            defineField({
              name: 'title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'type',
              type: 'string',
              options: {
                list: [
                  {title: 'GitHub Repo', value: 'repo'},
                  {title: 'Slides', value: 'slides'},
                  {title: 'Documentation', value: 'docs'},
                  {title: 'Other', value: 'other'},
                ],
              },
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'type'},
          },
        }),
      ],
      group: 'workshop',
      description:
        'Links to workshop materials — GitHub repos, slides, documentation. Made available to registered attendees before and after the workshop.',
      hidden: ({document}) => document?.sessionType !== 'workshop',
    }),

    // --- Media & Recordings ---
    defineField({
      name: 'slidesUrl',
      title: 'Slides URL',
      type: 'url',
      group: 'media',
      description:
        'Link to the presentation slides (Speaker Deck, Google Slides, etc.). Added after the talk and displayed on the session detail page.',
      hidden: ({document}) =>
        ['break', 'social'].includes(document?.sessionType as string),
    }),
    defineField({
      name: 'recordingUrl',
      title: 'Recording URL',
      type: 'url',
      group: 'media',
      description:
        'Link to the session recording (YouTube, Vimeo, etc.). Added post-conference. Displayed prominently on the session detail page.',
      hidden: ({document}) =>
        ['break', 'social'].includes(document?.sessionType as string),
    }),

    ...seoFields('seo'),
  ],
  orderings: [
    {title: 'Title A-Z', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
    {title: 'Type', name: 'type', by: [{field: 'sessionType', direction: 'asc'}]},
  ],
  preview: {
    select: {
      title: 'title',
      sessionType: 'sessionType',
      speaker0Name: 'speakers.0.name',
      speaker1Name: 'speakers.1.name',
      trackTitle: 'track.name',
    },
    prepare({title, sessionType, speaker0Name, speaker1Name, trackTitle}) {
      const typeLabel = sessionType
        ? (sessionType as string).charAt(0).toUpperCase() + (sessionType as string).slice(1)
        : ''
      const speakers = [speaker0Name, speaker1Name].filter(Boolean)
      const speakerText =
        speakers.length > 1 ? `${speakers[0]} +${speakers.length - 1}` : speakers[0] || ''
      return {
        title,
        subtitle: [typeLabel, speakerText, trackTitle].filter(Boolean).join(' · '),
      }
    },
  },
})
