import {defineArrayMember, defineField, defineType} from 'sanity'
import {HelpCircleIcon} from '@sanity/icons'

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ Section',
  type: 'object',
  description: 'A section displaying frequently asked questions, optionally filtered by category.',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Section heading, e.g., "Frequently Asked Questions."',
    }),
    defineField({
      name: 'items',
      title: 'FAQ Items',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'faq'}]})],
      description:
        'References to FAQ documents. Also used for JSON-LD FAQ structured data (SEO) and as a knowledge source for the AI concierge.',
    }),
  ],
  preview: {
    select: {title: 'heading', items: 'items'},
    prepare({title, items}) {
      return {
        title: title || 'FAQ Section',
        subtitle: items ? `${(items as unknown[]).length} questions` : 'No questions yet',
      }
    },
  },
})
