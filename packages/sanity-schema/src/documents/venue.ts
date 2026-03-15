import {defineArrayMember, defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons'

export const venue = defineType({
  name: 'venue',
  title: 'Venue',
  type: 'document',
  description: 'The physical location hosting the conference.',
  icon: PinIcon,
  groups: [
    {name: 'info', title: 'Information', default: true},
    {name: 'logistics', title: 'Logistics'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Venue Name',
      type: 'string',
      group: 'info',
      description:
        'The official venue name, e.g., "Javits Center." Displayed on the venue page and in email footers. Content Agent: use this when answering location questions.',
      validation: (rule) => rule.required().error('Venue name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'info',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      group: 'info',
      rows: 2,
      description:
        'Full street address. Displayed on the venue page and used for map embeds. Content Agent: provide this when attendees ask for directions.',
      validation: (rule) => rule.required().error('Add the venue address'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
      ],
      group: 'info',
      description:
        'Venue overview with photos. Displayed on the venue page. Include information about the space, atmosphere, and any notable features.',
    }),
    defineField({
      name: 'mapUrl',
      title: 'Map URL',
      type: 'url',
      group: 'info',
      description:
        'Google Maps or Apple Maps link. Opens in a new tab when attendees click "Get Directions."',
    }),
    defineField({
      name: 'transitInfo',
      title: 'Transit Information',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      group: 'logistics',
      description:
        'How to get to the venue — subway lines, bus routes, parking, bike racks. Displayed on the venue page. Content Agent: use this to answer "how do I get to the venue?"',
    }),
    defineField({
      name: 'wifiInfo',
      title: 'WiFi Information',
      type: 'object',
      group: 'logistics',
      description:
        'WiFi network details for attendees. Content Agent: provide this when attendees ask about WiFi.',
      fields: [
        defineField({name: 'network', title: 'Network Name', type: 'string'}),
        defineField({name: 'password', title: 'Password', type: 'string'}),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Venue Photo',
      type: 'image',
      group: 'info',
      options: {hotspot: true},
      description:
        'Primary venue photo. Used as the hero image on the venue page and in social cards.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().error('Alt text is required'),
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'address', media: 'image'},
  },
})
