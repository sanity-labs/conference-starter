import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons'

const ROUTE_OPTIONS = [
  {title: 'Schedule', value: '/schedule'},
  {title: 'Speakers', value: '/speakers'},
  {title: 'Sessions', value: '/sessions'},
  {title: 'Sponsors', value: '/sponsors'},
  {title: 'Venue', value: '/venue'},
  {title: 'Call for Papers', value: '/cfp'},
  {title: 'Announcements', value: '/announcements'},
  {title: 'FAQ', value: '/faq'},
]

export const navItem = defineType({
  name: 'navItem',
  title: 'Navigation Item',
  description: 'A navigation link with label and route or external URL.',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:
        'Override display text. If left empty, falls back to the referenced page title, the route label, or the URL.',
    }),
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: {
        list: [
          {title: 'App Route', value: 'route'},
          {title: 'Page Reference', value: 'page'},
          {title: 'External URL', value: 'external'},
        ],
        layout: 'radio',
      },
      initialValue: 'route',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'string',
      options: {list: ROUTE_OPTIONS},
      hidden: ({parent}) => (parent as Record<string, unknown>)?.linkType !== 'route',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.linkType === 'route' && !value) {
            return 'Pick a route'
          }
          return true
        }),
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{type: 'page'}, {type: 'session'}, {type: 'person'}],
      hidden: ({parent}) => (parent as Record<string, unknown>)?.linkType !== 'page',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.linkType === 'page' && !value) {
            return 'Select a page'
          }
          return true
        }),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      hidden: ({parent}) => (parent as Record<string, unknown>)?.linkType !== 'external',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.linkType === 'external' && !value) {
            return 'Enter a URL'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      linkType: 'linkType',
      route: 'route',
      pageTitle: 'page.title',
      url: 'url',
    },
    prepare({title, linkType, route, pageTitle, url}) {
      const fallbackTitle =
        linkType === 'page'
          ? pageTitle
          : linkType === 'route'
            ? ROUTE_OPTIONS.find((r) => r.value === route)?.title
            : url
      const subtitle =
        linkType === 'route'
          ? `Route: ${route ?? '(none)'}`
          : linkType === 'page'
            ? `Page: ${pageTitle ?? '(none)'}`
            : `External: ${url ?? '(none)'}`
      return {
        title: title || fallbackTitle || 'Untitled link',
        subtitle,
      }
    },
  },
})
