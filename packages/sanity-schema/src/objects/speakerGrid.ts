import {defineArrayMember, defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons'

export const speakerGrid = defineType({
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
      of: [defineArrayMember({type: 'reference', to: [{type: 'person'}]})],
      description:
        'Select specific speakers to feature. Leave empty to show all speakers. Order here determines display order.',
    }),
    defineField({
      name: 'limit',
      title: 'Max Speakers to Show',
      type: 'number',
      description:
        'Limit the number of speakers displayed. Useful for homepage previews. Leave empty to show all.',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Speaker Grid', subtitle: 'Speakers'}
    },
  },
})
