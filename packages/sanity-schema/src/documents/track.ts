import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons'

export const track = defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  description: 'A thematic track that groups related sessions on the schedule.',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Track Name',
      type: 'string',
      description:
        'The track name, e.g., "Frontend," "AI/ML," "Design Systems." Displayed as column headers on the schedule grid and as filter chips on the session listing. Content Agent: use track names when categorizing or recommending sessions.',
      validation: (rule) => rule.required().error('Track name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'name'},
      description:
        'URL-friendly identifier. Used for track filter URLs like /schedule?track=frontend.',
      validation: (rule) => rule.required().error('Generate a slug for track filtering'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description:
        'A 1-2 sentence description of what this track covers. Displayed on the schedule page when a track filter is active. Content Agent: use this to explain what kinds of sessions belong to this track.',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'color',
      description:
        "The accent color for this track. Used for schedule grid column headers, session card borders, and track badges. Pick a color that's accessible against white backgrounds.",
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description:
        'Controls the left-to-right order of tracks on the schedule grid. Lower numbers appear first.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {title: 'Display Order', name: 'order', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Name A-Z', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', subtitle: 'description'},
  },
})
