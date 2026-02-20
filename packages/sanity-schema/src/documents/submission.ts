import {defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

export const submission = defineType({
  name: 'submission',
  title: 'CFP Submission',
  type: 'document',
  icon: EnvelopeIcon,
  groups: [
    {name: 'proposal', title: 'Proposal', default: true},
    {name: 'submitter', title: 'Submitter'},
    {name: 'screening', title: 'Screening'},
  ],
  fields: [
    // Proposal group
    defineField({
      name: 'sessionTitle',
      title: 'Session Title',
      type: 'string',
      group: 'proposal',
      description:
        'The proposed title for the session. Displayed in the CFP review board. Content Agent: use this to understand the submission topic.',
      validation: (rule) => rule.required().error('A session title is required'),
    }),
    defineField({
      name: 'sessionType',
      title: 'Session Type',
      type: 'string',
      group: 'proposal',
      description: 'What format the submitter is proposing.',
      options: {
        list: [
          {title: 'Talk (30 min)', value: 'talk'},
          {title: 'Lightning Talk (10 min)', value: 'lightning'},
          {title: 'Panel', value: 'panel'},
          {title: 'Workshop (90 min)', value: 'workshop'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Select a session type'),
    }),
    defineField({
      name: 'abstract',
      title: 'Abstract',
      type: 'text',
      group: 'proposal',
      rows: 8,
      description:
        'A detailed description of the proposed session. What will attendees learn? Content Agent: use this to evaluate topic relevance and speaker expertise.',
      validation: (rule) =>
        rule
          .required()
          .min(100)
          .error('Write at least 100 characters describing your session')
          .max(2000)
          .warning('Keep abstracts under 2000 characters'),
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      group: 'proposal',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Select a target audience level'),
    }),
    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'array',
      group: 'proposal',
      of: [{type: 'string'}],
      description: 'Tags describing the talk topic (e.g., "React", "AI", "Design Systems").',
      options: {layout: 'tags'},
      validation: (rule) =>
        rule.min(1).error('Add at least one topic').max(5).warning('Keep it to 5 topics or fewer'),
    }),

    // Submitter group
    defineField({
      name: 'submitterName',
      title: 'Name',
      type: 'string',
      group: 'submitter',
      description: 'Full name of the person submitting.',
      validation: (rule) => rule.required().error('Name is required'),
    }),
    defineField({
      name: 'submitterEmail',
      title: 'Email',
      type: 'string',
      group: 'submitter',
      description: 'Contact email for the submitter. Used for acceptance/rejection notifications.',
      validation: (rule) => rule.required().email().error('A valid email address is required'),
    }),
    defineField({
      name: 'company',
      title: 'Company / Organization',
      type: 'string',
      group: 'submitter',
    }),
    defineField({
      name: 'bio',
      title: 'Speaker Bio',
      type: 'text',
      group: 'submitter',
      rows: 4,
      description: 'A short bio of the speaker. Used for evaluation and, if accepted, as seed for the speaker profile.',
      validation: (rule) =>
        rule
          .required()
          .min(50)
          .error('Write at least a short bio (50 characters)')
          .max(500)
          .warning('Keep bios under 500 characters'),
    }),

    // Screening group
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'screening',
      description:
        'Current status in the CFP pipeline. Moves from submitted → screening → scored → in-review → accepted/rejected/withdrawn.',
      options: {
        list: [
          {title: 'Submitted', value: 'submitted'},
          {title: 'Screening', value: 'screening'},
          {title: 'Scored', value: 'scored'},
          {title: 'In Review', value: 'in-review'},
          {title: 'Accepted', value: 'accepted'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Withdrawn', value: 'withdrawn'},
        ],
        layout: 'radio',
      },
      initialValue: 'submitted',
      readOnly: true,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      group: 'screening',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'aiScreening',
      title: 'AI Screening',
      type: 'object',
      group: 'screening',
      description:
        'AI-generated evaluation from the CFP screening Function. Populated automatically by Agent Actions in Sprint 3.',
      readOnly: true,
      fields: [
        defineField({
          name: 'score',
          title: 'Score',
          type: 'number',
          description: 'AI relevance score (0-100).',
          validation: (rule) => rule.min(0).max(100),
        }),
        defineField({
          name: 'summary',
          title: 'Summary',
          type: 'text',
          description: 'AI-generated evaluation summary.',
        }),
        defineField({
          name: 'scoredAt',
          title: 'Scored At',
          type: 'datetime',
        }),
      ],
    }),
    defineField({
      name: 'reviewNotes',
      title: 'Review Notes',
      type: 'text',
      group: 'screening',
      rows: 4,
      description: 'Internal notes from the editorial review. Not visible to submitters.',
    }),
    defineField({
      name: 'conference',
      title: 'Conference',
      type: 'reference',
      to: [{type: 'conference'}],
      group: 'screening',
      description: 'Which conference this submission is for.',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
    {
      title: 'AI Score (High to Low)',
      name: 'aiScoreDesc',
      by: [{field: 'aiScreening.score', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'sessionTitle',
      subtitle: 'submitterName',
      status: 'status',
      score: 'aiScreening.score',
    },
    prepare({title, subtitle, status, score}) {
      const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
      const scoreLabel = score != null ? ` · Score: ${score}` : ''
      return {
        title: title || 'Untitled',
        subtitle: `${subtitle || 'Unknown'} — ${statusLabel}${scoreLabel}`,
      }
    },
  },
})
