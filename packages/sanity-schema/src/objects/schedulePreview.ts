import {defineField, defineType} from 'sanity'
import {ClockIcon} from '@sanity/icons'

export const schedulePreview = defineType({
  name: 'schedulePreview',
  title: 'Schedule Preview',
  type: 'object',
  description: 'A preview of the conference schedule showing upcoming sessions.',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Section heading, e.g., "Schedule Highlights" or "What\'s On."',
    }),
    defineField({
      name: 'day',
      title: 'Day to Preview',
      type: 'date',
      description:
        'Show schedule slots for this specific day. Leave empty to show the first conference day.',
    }),
    defineField({
      name: 'maxSlots',
      title: 'Max Slots to Show',
      type: 'number',
      description: 'Limit the number of slots displayed. Useful for homepage teasers.',
      initialValue: 6,
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Schedule Preview', subtitle: 'Schedule'}
    },
  },
})
