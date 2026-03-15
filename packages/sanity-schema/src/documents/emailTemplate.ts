import {defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'
import {interpolationVariables} from 'sanity-plugin-pte-interpolation'

export const emailVariables = [
  {id: 'submitterName', name: 'Submitter Name', description: "CFP submitter's full name"},
  {id: 'sessionTitle', name: 'Session Title', description: 'Talk or session title'},
  {id: 'speakerName', name: 'Speaker Name', description: "Accepted speaker's name"},
  {id: 'conferenceName', name: 'Conference Name', description: 'e.g. Everything NYC 2026'},
]

export const emailTemplate = defineType({
  name: 'emailTemplate',
  title: 'Email Template',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Template Name',
      type: 'string',
      description: 'Internal name for this email template, e.g., "Speaker Confirmation" or "CFP Deadline Reminder."',
      validation: (rule) => rule.required().error('Template name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      description: 'URL-friendly identifier used to reference this template in code.',
      validation: (rule) => rule.required().error('Generate a slug for the template'),
    }),
    defineField({
      name: 'subject',
      title: 'Subject Line',
      type: 'string',
      description:
        'The email subject line. Supports template variables like {{speakerName}} or {{sessionTitle}} that get replaced at send time.',
      validation: (rule) => rule.required().error('Subject line is required'),
    }),
    defineField({
      name: 'body',
      title: 'Email Body',
      type: 'array',
      of: [interpolationVariables(emailVariables)],
      description:
        'The email content in rich text. Use the variable picker to insert dynamic values like names and titles. Preview tab shows resolved samples.',
      validation: (rule) => rule.required().error('Email body is required'),
    }),
    defineField({
      name: 'audience',
      title: 'Audience',
      type: 'string',
      description: 'Who this email is intended for. Used for filtering in the template list.',
      options: {
        list: [
          {title: 'All Attendees', value: 'all-attendees'},
          {title: 'Speakers', value: 'speakers'},
          {title: 'Sponsors', value: 'sponsors'},
          {title: 'CFP Submitters', value: 'submitters'},
        ],
      },
    }),
    defineField({
      name: 'trigger',
      title: 'Trigger',
      type: 'string',
      description: 'When this email gets sent. "Manual" means an editor triggers it from Studio.',
      options: {
        list: [
          {title: 'Manual', value: 'manual'},
          {title: 'On Submission Received', value: 'on-submission-received'},
          {title: 'On Submission Accepted', value: 'on-submission-accepted'},
          {title: 'On Submission Rejected', value: 'on-submission-rejected'},
          {title: 'On Speaker Confirmed', value: 'on-speaker-confirmed'},
          {title: 'Scheduled', value: 'scheduled'},
        ],
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      description: 'Active templates are available for sending. Draft templates are work-in-progress. Archived templates are no longer in use.',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Active', value: 'active'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
  ],
  preview: {
    select: {title: 'name', status: 'status', audience: 'audience'},
    prepare({title, status, audience}) {
      const statusLabel = status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : 'Draft'
      const audienceLabel = audience
        ? audience.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : ''
      return {
        title: title || 'Untitled Template',
        subtitle: [statusLabel, audienceLabel].filter(Boolean).join(' · '),
      }
    },
  },
})
