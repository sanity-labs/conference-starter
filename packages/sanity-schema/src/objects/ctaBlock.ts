import {defineField, defineType} from 'sanity'
import {LaunchIcon} from '@sanity/icons'

export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'Call to Action Block',
  type: 'object',
  description: 'A prominent call-to-action block with heading, text, and action buttons.',
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
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'CTA Block', subtitle: 'Call to Action'}
    },
  },
})
