import {defineArrayMember, defineField, defineType} from 'sanity'
import {BellIcon} from '@sanity/icons'

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  description:
    'An operational update distributed to website, email, and Telegram. Set status to "published" to trigger distribution.',
  icon: BellIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The announcement headline. Max 120 characters.',
      validation: (rule) =>
        rule.required().max(120).error('Title is required and must be under 120 characters'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 5,
      description: 'Plain text message. Distributed as-is to all channels.',
      validation: (rule) => rule.required().error('Write the announcement body'),
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      description: 'Optional links appended to the announcement on all channels.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'externalLink',
          title: 'External Link',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'url', type: 'url', validation: (rule) => rule.required()}),
          ],
          preview: {
            select: {title: 'label', subtitle: 'url'},
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'internalLink',
          title: 'Internal Link',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'reference',
              type: 'reference',
              to: [{type: 'session'}, {type: 'person'}, {type: 'venue'}],
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'label', refTitle: 'reference.title', refName: 'reference.name'},
            prepare({title, refTitle, refName}) {
              return {title, subtitle: refTitle || refName || 'Internal link'}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Ready', value: 'ready'},
          {title: 'Published', value: 'published'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      description:
        'Draft → compose. Ready → reviewed. Published → triggers distribution to email + Telegram.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      readOnly: true,
      description: 'Auto-set when first published by the distribution function.',
    }),
    defineField({
      name: 'signageOverlay',
      title: 'Broadcast on Signage',
      type: 'boolean',
      description:
        'When ON, this announcement appears as a high-contrast overlay on every active signage display (unless the display has opted out). Use for schedule changes, lunch calls, or anything attendees on the floor need to see right now. Toggling this updates the screens within seconds via SanityLive.',
      initialValue: false,
    }),
    defineField({
      name: 'signageOverlayDurationSeconds',
      title: 'Signage Overlay Duration (seconds)',
      type: 'number',
      description:
        'How long the overlay stays on screen before auto-dismissing. Default 90 seconds. Increase for safety-critical messages, decrease for short calls like "lunch is open."',
      initialValue: 90,
      hidden: ({document}) => document?.signageOverlay !== true,
      validation: (rule) =>
        rule.min(10).max(600).error('Pick a duration between 10 and 600 seconds'),
    }),
    defineField({
      name: 'distributionLog',
      title: 'Distribution Log',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'logEntry',
          fields: [
            defineField({name: 'channel', type: 'string'}),
            defineField({name: 'sentAt', type: 'datetime'}),
            defineField({name: 'status', type: 'string'}),
            defineField({name: 'details', type: 'string'}),
          ],
          preview: {
            select: {channel: 'channel', sentAt: 'sentAt', status: 'status'},
            prepare({channel, sentAt, status}) {
              return {
                title: `${channel} — ${status}`,
                subtitle: sentAt ? new Date(sentAt).toLocaleString() : '',
              }
            },
          },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', status: 'status', publishedAt: 'publishedAt'},
    prepare({title, status, publishedAt}) {
      const emoji = status === 'published' ? '🟢' : status === 'ready' ? '🟡' : '⚪'
      return {
        title: `${emoji} ${title}`,
        subtitle: publishedAt
          ? new Date(publishedAt as string).toLocaleDateString()
          : status || 'draft',
      }
    },
  },
})
