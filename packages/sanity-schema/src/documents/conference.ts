import {defineArrayMember, defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons'
import {seoFields} from '../shared/seoFields'

export const conference = defineType({
  name: 'conference',
  title: 'Conference',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    {name: 'details', title: 'Details', default: true},
    {name: 'venue', title: 'Venue & Logistics'},
    {name: 'branding', title: 'Branding'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Conference Name',
      type: 'string',
      group: 'details',
      description:
        'The official name of the conference, displayed in the header, page titles, and email subject lines. Content Agent: use this as the canonical event name in all generated content.',
      validation: (rule) => rule.required().error('Every conference needs a name'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'details',
      description:
        'URL-friendly identifier. Auto-generated from the conference name. Used in all page routes.',
      options: {source: 'name'},
      validation: (rule) =>
        rule.required().error('Generate a slug — it powers all the page URLs'),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'details',
      description:
        'A short, punchy subtitle displayed below the conference name on the homepage hero. Keep it under 100 characters. Content Agent: use this to capture the conference vibe in generated social copy.',
      validation: (rule) => rule.max(100).warning('Taglines work best under 100 characters'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'details',
      rows: 4,
      description:
        'A 2-4 sentence overview of the conference. Displayed on the homepage, shared in social previews, and used by Content Agent as context when generating session descriptions or email content.',
      validation: (rule) =>
        rule
          .required()
          .min(50)
          .error('Write at least a couple of sentences describing the conference'),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      group: 'details',
      description:
        'When the conference begins. Used for countdown timers, schedule filtering, and Luma event sync. Content Agent: reference this when generating time-sensitive content like "only X days away."',
      validation: (rule) =>
        rule.required().error('Set the start date — it drives the countdown and schedule'),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      group: 'details',
      description:
        'When the conference ends. Must be after the start date. Used to calculate conference duration and close registration.',
      validation: (rule) =>
        rule.required().custom((endDate, context) => {
          const startDate = (context.document as Record<string, unknown>)?.startDate as
            | string
            | undefined
          if (startDate && endDate && new Date(endDate as string) <= new Date(startDate)) {
            return 'End date must be after the start date'
          }
          return true
        }),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: [{type: 'venue'}],
      group: 'venue',
      description:
        'The primary venue for this conference. Rooms are defined on the venue document. Content Agent: use venue details (address, transit info) when answering attendee logistics questions.',
    }),
    defineField({
      name: 'tracks',
      title: 'Tracks',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'track'}]})],
      group: 'details',
      description:
        'The conference tracks (e.g., "Frontend," "AI/ML," "Design Systems"). Tracks organize sessions into thematic streams. Order here determines display order on the schedule page.',
      validation: (rule) => rule.min(1).error('Add at least one track'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      options: {hotspot: true},
      description:
        'Conference logo. Used in the site header, emails, and social cards. Upload an SVG or high-res PNG with transparent background.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Accessible description of the logo. Required for screen readers.',
          validation: (rule) => rule.required().error('Alt text is required for accessibility'),
        }),
      ],
    }),
    defineField({
      name: 'socialCard',
      title: 'Social Card Image',
      type: 'image',
      group: 'branding',
      description:
        'The default Open Graph image (1200x630px). Shown when the site is shared on social media. Individual sessions and speakers can override this.',
    }),
    ...seoFields('seo'),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'tagline',
      startDate: 'startDate',
      media: 'logo',
    },
    prepare({title, subtitle, startDate, media}) {
      return {
        title,
        subtitle: startDate
          ? `${new Date(startDate as string).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} — ${subtitle || ''}`
          : subtitle,
        media,
      }
    },
  },
})
