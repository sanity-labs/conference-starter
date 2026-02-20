import {defineArrayMember, defineField, defineType} from 'sanity'
import {HelpCircleIcon} from '@sanity/icons'

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ Section',
  type: 'object',
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
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              description:
                'The question as attendees would ask it. Content Agent: use these Q&A pairs to answer attendee questions directly.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'array',
              of: [defineArrayMember({type: 'block'})],
              description: 'The answer. Keep it concise — 1-3 sentences is ideal.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'question'},
          },
        }),
      ],
      description:
        'Question and answer pairs. Also used for JSON-LD FAQ structured data (SEO) and as a knowledge source for the AI concierge.',
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
