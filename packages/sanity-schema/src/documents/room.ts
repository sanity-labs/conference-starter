import {defineArrayMember, defineField, defineType} from 'sanity'
import {ComponentIcon} from '@sanity/icons'

export const room = defineType({
  name: 'room',
  title: 'Room',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Room Name',
      type: 'string',
      description:
        'The room name as displayed on the schedule grid and session detail pages, e.g., "Main Hall," "Workshop Room A." Content Agent: use this when answering "where is [session]?"',
      validation: (rule) => rule.required().error('Room name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'name'},
      description:
        'URL-friendly identifier. Enables room detail pages with floor maps, amenities, and "sessions in this room" listings.',
      validation: (rule) => rule.required().error('Generate a slug for the room page URL'),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: [{type: 'venue'}],
      description: 'Which venue this room belongs to. Enables venue-scoped room listings.',
      validation: (rule) => rule.required().error('Select the venue this room belongs to'),
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      description:
        "Maximum seating capacity. Used for scheduling validation — workshops shouldn't be assigned to rooms smaller than their capacity. Displayed on the venue page.",
      validation: (rule) => rule.min(1).error('Capacity must be at least 1'),
    }),
    defineField({
      name: 'floor',
      title: 'Floor',
      type: 'string',
      description:
        'Which floor the room is on, e.g., "2nd Floor," "Mezzanine." Helps attendees navigate the venue.',
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      description:
        'Available equipment and features, e.g., "Projector," "Whiteboard," "Power outlets at every seat." Helps organizers assign sessions to appropriate rooms.',
      options: {
        list: [
          {title: 'Projector', value: 'projector'},
          {title: 'Whiteboard', value: 'whiteboard'},
          {title: 'Power Outlets', value: 'power'},
          {title: 'Video Recording', value: 'recording'},
          {title: 'Livestream', value: 'livestream'},
          {title: 'Wheelchair Accessible', value: 'accessible'},
          {title: 'Hearing Loop', value: 'hearing-loop'},
        ],
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description:
        'Controls the display order in room listings. Lower numbers appear first.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {title: 'Display Order', name: 'order', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Name A-Z', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', venueName: 'venue.name', capacity: 'capacity'},
    prepare({title, venueName, capacity}) {
      return {
        title,
        subtitle: [venueName, capacity ? `${capacity} seats` : null].filter(Boolean).join(' · '),
      }
    },
  },
})
