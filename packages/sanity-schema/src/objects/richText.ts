import {defineArrayMember, defineField, defineType} from 'sanity'
import {TextIcon} from '@sanity/icons'

export const richText = defineType({
  name: 'richText',
  title: 'Rich Text Section',
  type: 'object',
  description: 'A freeform rich text section with optional heading.',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      description: 'Optional heading displayed above the text content.',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
      ],
      description: 'Rich text content with optional images.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Rich Text', subtitle: 'Text Section'}
    },
  },
})
