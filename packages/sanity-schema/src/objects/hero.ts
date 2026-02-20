import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons'

export const hero = defineType({
  name: 'hero',
  title: 'Hero Section',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description:
        'The main hero heading. Keep it short and impactful — this is the first thing visitors see.',
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
      options: {hotspot: true},
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
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Hero Section', subtitle: 'Hero'}
    },
  },
})
