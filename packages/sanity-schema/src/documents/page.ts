import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'
import {seoFields} from '../shared/seoFields'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      group: 'content',
      description:
        'The page title displayed in the browser tab and as the H1 heading. Content Agent: use this as the canonical page name.',
      validation: (rule) => rule.required().error('Page title is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title'},
      description: 'The URL path for this page, e.g., "about" becomes /about.',
      validation: (rule) => rule.required().error('Generate a slug for the page URL'),
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'hero'}),
        defineArrayMember({type: 'richText'}),
        defineArrayMember({type: 'speakerGrid'}),
        defineArrayMember({type: 'sponsorBar'}),
        defineArrayMember({type: 'schedulePreview'}),
        defineArrayMember({type: 'ctaBlock'}),
        defineArrayMember({type: 'faqSection'}),
      ],
      description:
        'Build the page by adding and reordering sections. Each section type has its own fields and layout. Visual Editing: click any section on the preview to edit it directly.',
    }),
    ...seoFields('seo'),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}) {
      return {title, subtitle: slug ? `/${slug}` : ''}
    },
  },
})
