import {defineField, defineType} from 'sanity'
import {ClockIcon} from '@sanity/icons'

export const scheduleSlot = defineType({
  name: 'scheduleSlot',
  title: 'Schedule Slot',
  type: 'document',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'session',
      title: 'Session',
      type: 'reference',
      to: [{type: 'session'}],
      description:
        'The session assigned to this time slot. One session can only occupy one slot (no double-booking). Content Agent: when answering "when is [talk]?", look up the slot for that session.',
      validation: (rule) =>
        rule
          .required()
          .error('Assign a session to this slot')
          .custom(async (value, context) => {
            if (!value?._ref) return true
            const client = context.getClient({apiVersion: '2025-11-01'})
            const id = context.document?._id?.replace(/^drafts\./, '')
            const existing = await client.fetch(
              `count(*[_type == "scheduleSlot" && session._ref == $ref && _id != $id && !(_id in path("drafts.**"))])`,
              {ref: value._ref, id},
            )
            return existing === 0 || 'This session is already assigned to another time slot'
          }),
    }),
    defineField({
      name: 'conference',
      title: 'Conference',
      type: 'reference',
      to: [{type: 'conference'}],
      description:
        'Which conference this slot belongs to. Enables multi-conference support and scopes schedule queries.',
      validation: (rule) => rule.required().error('Select the conference'),
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'datetime',
      description:
        'When this session begins. Used for schedule grid positioning, calendar exports, and "happening now" indicators. Content Agent: use this to answer "what time is [talk]?"',
      validation: (rule) => rule.required().error('Set the start time'),
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'datetime',
      description:
        'When this session ends. Must be after start time. Auto-calculated from session duration if left empty (future enhancement).',
      validation: (rule) =>
        rule.required().custom((endTime, context) => {
          const startTime = (context.document as Record<string, unknown>)?.startTime as
            | string
            | undefined
          if (startTime && endTime && new Date(endTime as string) <= new Date(startTime)) {
            return 'End time must be after start time'
          }
          return true
        }),
    }),
    defineField({
      name: 'room',
      title: 'Room',
      type: 'reference',
      to: [{type: 'room'}],
      description:
        'Which room this session takes place in. Displayed on the schedule grid and session detail page. Content Agent: use this to answer "where is [talk]?"',
      validation: (rule) => rule.required().error('Assign a room'),
    }),
    defineField({
      name: 'isPlenary',
      title: 'Plenary Session',
      type: 'boolean',
      description:
        'If true, this session spans all tracks (keynotes, breaks, socials). Displayed as a full-width row on the schedule grid instead of in a single track column.',
      initialValue: false,
    }),
  ],
  validation: (rule) =>
    rule.custom(async (doc, context) => {
      const slot = doc as Record<string, unknown> | undefined
      const roomRef = (slot?.room as {_ref?: string} | undefined)?._ref
      const startTime = slot?.startTime as string | undefined
      const endTime = slot?.endTime as string | undefined
      if (!roomRef || !startTime || !endTime) return true

      const client = context.getClient({apiVersion: '2025-11-01'})
      const id = (slot?._id as string | undefined)?.replace(/^drafts\./, '')

      const conflicts = await client.fetch(
        `*[_type == "scheduleSlot"
          && room._ref == $roomRef
          && _id != $id
          && !(_id in path("drafts.**"))
          && startTime < $endTime
          && endTime > $startTime
        ]{ session->{ title } }`,
        {
          roomRef,
          id,
          startTime,
          endTime,
        },
      )

      if (conflicts.length > 0) {
        const titles = conflicts
          .map((c: {session?: {title?: string}}) => c.session?.title || 'Untitled')
          .join(', ')
        return {
          message: `This room already has "${titles}" scheduled during this time. Double-check for conflicts.`,
          level: 'warning',
        } as const
      }
      return true
    }),
  orderings: [
    {title: 'Start Time', name: 'startTime', by: [{field: 'startTime', direction: 'asc'}]},
  ],
  preview: {
    select: {
      sessionTitle: 'session.title',
      startTime: 'startTime',
      roomName: 'room.name',
    },
    prepare({sessionTitle, startTime, roomName}) {
      const time = startTime
        ? new Date(startTime as string).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Unscheduled'
      return {
        title: sessionTitle || 'Empty Slot',
        subtitle: `${time} · ${roomName || 'No room'}`,
      }
    },
  },
})
