import {defineField, defineType} from 'sanity'

export const cta = defineType({
  name: 'cta',
  title: 'Call to Action',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button Label',
      type: 'string',
      description:
        'The button text, e.g., "Register Now," "View Schedule." Keep it action-oriented and under 30 characters.',
      validation: (rule) =>
        rule.required().max(30).error('Button labels should be under 30 characters'),
    }),
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: {list: ['internal', 'external'], layout: 'radio'},
      initialValue: 'external',
    }),
    defineField({
      name: 'internalLink',
      title: 'Internal Page',
      type: 'reference',
      to: [{type: 'page'}, {type: 'session'}, {type: 'speaker'}],
      hidden: ({parent}) => (parent as Record<string, unknown>)?.linkType !== 'internal',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({parent}) => (parent as Record<string, unknown>)?.linkType !== 'external',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'style',
      title: 'Button Style',
      type: 'string',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
          {title: 'Ghost', value: 'ghost'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
  ],
})
