import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons'
import {seoFields} from '../shared/seoFields'

export const speaker = defineType({
  name: 'speaker',
  title: 'Speaker',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'profile', title: 'Profile', default: true},
    {name: 'social', title: 'Social & Links'},
    {name: 'logistics', title: 'Logistics'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      group: 'profile',
      description:
        "The speaker's full name as they want it displayed. Used on speaker cards, session pages, and in email communications. Content Agent: use this exact name — don't abbreviate or modify.",
      validation: (rule) => rule.required().error('Speaker name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'profile',
      description:
        "URL-friendly identifier for the speaker's profile page. Auto-generated from name.",
      options: {source: 'name'},
      validation: (rule) => rule.required().error('Generate a slug for the speaker profile URL'),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'profile',
      options: {hotspot: true},
      description:
        'Professional headshot. Displayed on speaker cards (cropped to square) and profile pages. Use hotspot to set the focal point for cropping. Minimum 400x400px recommended.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description:
            'Accessible description, e.g., "Headshot of Sarah Chen." Required for accessibility.',
          validation: (rule) => rule.required().error('Alt text is required for accessibility'),
        }),
      ],
      validation: (rule) =>
        rule.required().error("Upload a speaker photo — it's displayed on cards and profile pages"),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      group: 'profile',
      description:
        'The speaker\'s current job title, e.g., "Senior Engineer at Vercel." Displayed below their name on speaker cards. Content Agent: include this in generated bios and social announcements.',
      validation: (rule) =>
        rule.required().error("Add the speaker's role — it appears on their card"),
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      group: 'profile',
      description:
        "The speaker's current company or organization. Displayed on speaker cards and used for filtering. If independent, use \"Independent\" or their consultancy name.",
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      group: 'profile',
      description:
        'Speaker biography, 2-4 paragraphs. Displayed on the speaker profile page and talk detail pages. Should include current role, relevant expertise, and notable achievements. Content Agent: use this as the authoritative source for speaker background when generating introductions or social posts.',
      validation: (rule) =>
        rule.required().error("Write a bio — it's the main content on the speaker profile page"),
    }),
    defineField({
      name: 'twitter',
      title: 'X (Twitter) Handle',
      type: 'string',
      group: 'social',
      description:
        'Twitter/X handle without the @ symbol, e.g., "sarah_codes." Used for social links and Content Agent when generating social media announcements.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (value.startsWith('@')) return 'Enter the handle without the @ symbol'
          if (!/^[a-zA-Z0-9_]+$/.test(value))
            return 'Handle can only contain letters, numbers, and underscores'
          return true
        }),
    }),
    defineField({
      name: 'github',
      title: 'GitHub Username',
      type: 'string',
      group: 'social',
      description: 'GitHub username, e.g., "sarahchen." Linked from the speaker profile page.',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'social',
      description: 'Full LinkedIn profile URL. Linked from the speaker profile page.',
      validation: (rule) =>
        rule.uri({scheme: ['https']}).error('Use the full LinkedIn URL starting with https://'),
    }),
    defineField({
      name: 'website',
      title: 'Personal Website',
      type: 'url',
      group: 'social',
      description:
        "The speaker's personal website or blog. Linked from the speaker profile page.",
      validation: (rule) =>
        rule
          .uri({scheme: ['http', 'https']})
          .error('Enter a valid URL starting with http:// or https://'),
    }),
    defineField({
      name: 'travelStatus',
      title: 'Travel Status',
      type: 'string',
      group: 'logistics',
      description:
        'Internal field for organizers. Tracks whether travel arrangements are confirmed. Not displayed on the website.',
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
      group: 'logistics',
      rows: 3,
      description:
        'Private notes for organizers — dietary requirements, AV needs, scheduling constraints. Never displayed publicly.',
    }),
    ...seoFields('seo'),
  ],
  orderings: [
    {title: 'Name A-Z', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
    {title: 'Company', name: 'company', by: [{field: 'company', direction: 'asc'}]},
  ],
  preview: {
    select: {
      title: 'name',
      role: 'role',
      company: 'company',
      media: 'photo',
    },
    prepare({title, role, company, media}) {
      return {
        title,
        subtitle: [role, company].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
