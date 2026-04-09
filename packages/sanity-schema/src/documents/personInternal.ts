import {defineField, defineType} from 'sanity'
import {LockIcon} from '@sanity/icons'

export const personInternal = defineType({
  name: 'personInternal',
  title: 'Person (Internal)',
  type: 'document',
  liveEdit: true,
  icon: LockIcon,
  description:
    'Private logistics data for organizers — separated from the public person profile so Agent Context cannot access it.',
  fields: [
    defineField({
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{type: 'person'}],
      weak: true,
      description: 'The person this internal record belongs to.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description:
        'Contact email address. Used for organizer communications and email notifications. Not displayed publicly.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
          return true
        }),
    }),
    defineField({
      name: 'telegramId',
      title: 'Telegram ID',
      type: 'string',
      description:
        'Telegram user ID (numeric). Used for access control on the Telegram ops bot. Find via @userinfobot on Telegram.',
    }),
    defineField({
      name: 'travelStatus',
      title: 'Travel Status',
      type: 'string',
      description:
        'Internal field for organizers. Tracks whether travel arrangements are confirmed.',
      options: {
        list: [
          {title: 'Not Started', value: 'not-started'},
          {title: 'In Progress', value: 'in-progress'},
          {title: 'Booked', value: 'booked'},
          {title: 'N/A (Local)', value: 'local'},
        ],
        layout: 'radio',
      },
      initialValue: 'not-started',
    }),
    defineField({
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      description:
        'Private notes for organizers — dietary requirements, AV needs, scheduling constraints. Never displayed publicly.',
    }),
  ],
  preview: {
    select: {
      personName: 'person.name',
      email: 'email',
    },
    prepare({personName, email}) {
      return {
        title: personName || 'Unknown person',
        subtitle: email || 'No email',
      }
    },
  },
})
