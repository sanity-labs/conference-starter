import {defineField} from 'sanity'

export const seoFields = (group: string) => [
  defineField({
    name: 'seoTitle',
    title: 'SEO Title',
    type: 'string',
    group,
    description:
      'Custom title for search engines and social sharing. Falls back to the document title if empty. Keep under 60 characters for best display in search results.',
    validation: (rule) =>
      rule.max(60).warning('SEO titles over 60 characters get truncated in search results'),
  }),
  defineField({
    name: 'seoDescription',
    title: 'SEO Description',
    type: 'text',
    group,
    rows: 3,
    description:
      'Meta description for search engines. Displayed below the title in search results. Keep between 120-160 characters. Content Agent: generate this from the main content if empty.',
    validation: (rule) =>
      rule
        .max(160)
        .warning('Meta descriptions over 160 characters get truncated in search results'),
  }),
  defineField({
    name: 'ogImage',
    title: 'Social Share Image',
    type: 'image',
    group,
    description:
      'Custom Open Graph image (1200x630px) for social sharing. Falls back to the conference default if empty.',
  }),
]
