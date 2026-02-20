import {defineArrayMember, defineField, defineType} from 'sanity'
import {StarIcon} from '@sanity/icons'

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Company Name',
      type: 'string',
      description:
        'The sponsor\'s company name. Displayed on the sponsor page and in the homepage sponsor bar. Content Agent: use this when listing sponsors or answering "who is sponsoring?"',
      validation: (rule) => rule.required().error('Sponsor name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Sponsorship Tier',
      type: 'string',
      description:
        'The sponsorship level. Determines logo size and placement on the sponsor page. Platinum sponsors get the largest logos and top placement.',
      options: {
        list: [
          {title: 'Platinum', value: 'platinum'},
          {title: 'Gold', value: 'gold'},
          {title: 'Silver', value: 'silver'},
          {title: 'Bronze', value: 'bronze'},
          {title: 'Community', value: 'community'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Select a sponsorship tier'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description:
        'Company logo. Upload an SVG or high-res PNG with transparent background. Displayed on the sponsor page and homepage sponsor bar.',
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
      of: [defineArrayMember({type: 'block'})],
      description:
        'A short description of the sponsor and what they do. Displayed on the sponsor detail section. Content Agent: use this when attendees ask about a sponsor.',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      description:
        "The sponsor's website. Linked from their logo on the sponsor page.",
      validation: (rule) =>
        rule.uri({scheme: ['https']}).error('Use the full URL starting with https://'),
    }),
    defineField({
      name: 'order',
      title: 'Display Order (within tier)',
      type: 'number',
      description:
        'Controls the order within the same tier. Lower numbers appear first. Sponsors in higher tiers always appear above lower tiers.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Tier + Order',
      name: 'tierOrder',
      by: [
        {field: 'tier', direction: 'asc'},
        {field: 'order', direction: 'asc'},
      ],
    },
    {title: 'Name A-Z', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', tier: 'tier', media: 'logo'},
    prepare({title, tier, media}) {
      return {
        title,
        subtitle: tier ? (tier as string).charAt(0).toUpperCase() + (tier as string).slice(1) : '',
        media,
      }
    },
  },
})
