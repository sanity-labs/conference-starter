import {defineArrayMember, defineField, defineType} from 'sanity'
import {StarIcon} from '@sanity/icons'

export const sponsorBar = defineType({
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
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Platinum', value: 'platinum'},
          {title: 'Gold', value: 'gold'},
          {title: 'Silver', value: 'silver'},
          {title: 'Bronze', value: 'bronze'},
          {title: 'Community', value: 'community'},
        ],
      },
      description: 'Which sponsor tiers to display. Leave empty to show all tiers.',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Sponsor Bar', subtitle: 'Sponsors'}
    },
  },
})
