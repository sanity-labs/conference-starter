import {defineArrayMember, defineField, defineType} from 'sanity'
import {BellIcon} from '@sanity/icons'
import {seoFields} from '../shared/seoFields'

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  icon: BellIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description:
        'The announcement headline. Displayed on the announcements listing and detail page. Content Agent: use this when summarizing recent news.',
      validation: (rule) => rule.required().error('Announcement title is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      group: 'content',
      description:
        'When this announcement was published. Used for sorting and display. Can be set to a future date for scheduled publishing via Content Releases.',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 3,
      description:
        'A 1-2 sentence summary displayed on the announcements listing page and in social previews. Keep it under 200 characters for best results.',
      validation: (rule) => rule.max(200).warning('Excerpts work best under 200 characters'),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
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
      options: {hotspot: true},
      description:
        'Featured image displayed at the top of the announcement and in social cards.',
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
    {
      title: 'Newest First',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', publishedAt: 'publishedAt', media: 'coverImage'},
    prepare({title, publishedAt, media}) {
      return {
        title,
        subtitle: publishedAt
          ? new Date(publishedAt as string).toLocaleDateString()
          : 'Draft',
        media,
      }
    },
  },
})
