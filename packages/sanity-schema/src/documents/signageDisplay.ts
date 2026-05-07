import {defineArrayMember, defineField, defineType} from 'sanity'
import {DesktopIcon} from '@sanity/icons'

const KIND_USES_ROOM = ['now-next']
const KIND_USES_ROOMS = ['hallway-carousel']
const KIND_USES_LOOKAHEAD = ['speaker-spotlight', 'hallway-carousel']
const KIND_USES_DWELL = ['sponsor-reel', 'speaker-spotlight', 'hallway-carousel']

export const signageDisplay = defineType({
  name: 'signageDisplay',
  title: 'Signage Display',
  type: 'document',
  description:
    'A configured digital signage screen at the venue. Each document corresponds to one TV/monitor pointing at /signage/<slug>. Pick a kind, configure presentation, give it a memorable name so ops can find the right screen on the floor.',
  icon: DesktopIcon,
  groups: [
    {name: 'identity', title: 'Identity', default: true},
    {name: 'content', title: 'Content'},
    {name: 'presentation', title: 'Presentation'},
    {name: 'ops', title: 'Operations'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Display Name',
      type: 'string',
      group: 'identity',
      description:
        'Operator-facing label, e.g. "Schema Lab — outside door, portrait". This is for ops only — attendees never see it. Be specific so the right screen on the floor is easy to find when something needs adjusting.',
      validation: (rule) => rule.required().error('Give this display a memorable name'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'identity',
      options: {source: 'name'},
      description: 'URL-friendly identifier. Drives /signage/<slug>.',
      validation: (rule) => rule.required().error('Generate a slug — it powers the display URL'),
    }),
    defineField({
      name: 'kind',
      title: 'Display Kind',
      type: 'string',
      group: 'identity',
      description:
        'What this display shows. Some kinds need extra configuration (room for now-next, optional rooms for hallway-carousel). The relevant fields appear once a kind is selected.',
      options: {
        list: [
          {title: 'Now / Next (one room)', value: 'now-next'},
          {title: 'Day Agenda (full schedule)', value: 'day-agenda'},
          {title: 'Sponsor Reel', value: 'sponsor-reel'},
          {title: 'Speaker Spotlight', value: 'speaker-spotlight'},
          {title: 'Hallway Carousel', value: 'hallway-carousel'},
          {title: 'Welcome Hero', value: 'welcome-hero'},
        ],
        layout: 'radio',
      },
      initialValue: 'now-next',
      validation: (rule) => rule.required().error('Pick a display kind'),
    }),
    defineField({
      name: 'room',
      title: 'Room',
      type: 'reference',
      to: [{type: 'room'}],
      group: 'content',
      description:
        'For now-next displays: which room\'s schedule to show. The display will render the current and next session in this room.',
      hidden: ({document}) => !KIND_USES_ROOM.includes(document?.kind as string),
      validation: (rule) =>
        rule.custom((value, context) => {
          const kind = (context.document as Record<string, unknown>)?.kind as string | undefined
          if (kind && KIND_USES_ROOM.includes(kind) && !value?._ref) {
            return 'Pick a room — now-next displays need one'
          }
          return true
        }),
    }),
    defineField({
      name: 'rooms',
      title: 'Rooms',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'room'}]})],
      group: 'content',
      description:
        'For hallway-carousel: which rooms to cycle through. Leave empty to cycle every room with sessions today.',
      hidden: ({document}) => !KIND_USES_ROOMS.includes(document?.kind as string),
    }),
    defineField({
      name: 'lookaheadMinutes',
      title: 'Lookahead (minutes)',
      type: 'number',
      group: 'content',
      description:
        'How far ahead to look for "upcoming" content. Used by speaker-spotlight (which speakers go on next?) and hallway-carousel (what\'s coming up across rooms?). Default 30 minutes is a good fit for most conferences.',
      initialValue: 30,
      hidden: ({document}) => !KIND_USES_LOOKAHEAD.includes(document?.kind as string),
      validation: (rule) =>
        rule.min(5).max(240).error('Lookahead should be between 5 and 240 minutes'),
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      group: 'presentation',
      description:
        'Light or dark. Default dark — most TVs sit in dim rooms and large dark surfaces are easier on the eyes.',
      options: {
        list: [
          {title: 'Dark', value: 'dark'},
          {title: 'Light', value: 'light'},
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
    }),
    defineField({
      name: 'orientation',
      title: 'Orientation',
      type: 'string',
      group: 'presentation',
      description:
        'Landscape (16:9) or portrait (9:16). Drives which layout template renders. Type and spacing scale with viewport units, so this is the only resolution-aware setting you need.',
      options: {
        list: [
          {title: 'Landscape', value: 'landscape'},
          {title: 'Portrait', value: 'portrait'},
        ],
        layout: 'radio',
      },
      initialValue: 'landscape',
    }),
    defineField({
      name: 'dwellSeconds',
      title: 'Dwell (seconds)',
      type: 'number',
      group: 'presentation',
      description:
        'How long each frame stays on screen for carousel-style kinds (sponsor-reel, speaker-spotlight, hallway-carousel). 8 seconds is a good default — long enough to read, short enough to keep things moving.',
      initialValue: 8,
      hidden: ({document}) => !KIND_USES_DWELL.includes(document?.kind as string),
      validation: (rule) => rule.min(2).max(120).error('Dwell should be between 2 and 120 seconds'),
    }),
    defineField({
      name: 'transition',
      title: 'Transition',
      type: 'string',
      group: 'presentation',
      description: 'How frames swap. Fade is the gentlest — slide is more attention-grabbing.',
      options: {
        list: [
          {title: 'Fade', value: 'fade'},
          {title: 'Slide', value: 'slide'},
          {title: 'None', value: 'none'},
        ],
        layout: 'radio',
      },
      initialValue: 'fade',
    }),
    defineField({
      name: 'showClock',
      title: 'Show Clock',
      type: 'boolean',
      group: 'presentation',
      description:
        'Display a wall clock in the corner. Helpful next to session rooms and lobby anchors; usually off for sponsor reels and welcome heroes.',
      initialValue: true,
    }),
    defineField({
      name: 'showConferenceBranding',
      title: 'Show Conference Branding',
      type: 'boolean',
      group: 'presentation',
      description: 'Render the conference name and tagline as a small chrome strip.',
      initialValue: true,
    }),
    defineField({
      name: 'showAnnouncementOverlay',
      title: 'Show Announcement Overlay',
      type: 'boolean',
      group: 'presentation',
      description:
        'When ON: published announcements flagged for screen broadcast appear as a high-contrast overlay on top of this display. When OFF: this screen is opted out (e.g. a sponsor reel that contractually cannot be interrupted).',
      initialValue: true,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'ops',
      description:
        'When OFF, /signage/<slug> renders a "this display is paused" message instead of content. Use this for screens being repositioned or temporarily off-air without losing the configuration.',
      initialValue: true,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      group: 'ops',
      rows: 3,
      description:
        'Operator notes for the venue team. Where is the screen physically? Which device drives it? Is there anything fragile about the setup? Never shown on the display itself.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      kind: 'kind',
      active: 'active',
      roomName: 'room.name',
    },
    prepare({title, kind, active, roomName}) {
      const kindLabel = (kind as string)?.replace('-', ' ') || 'unconfigured'
      const status = active === false ? 'paused' : 'active'
      return {
        title,
        subtitle: `${kindLabel}${roomName ? ` · ${roomName}` : ''} · ${status}`,
      }
    },
  },
})
