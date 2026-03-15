import {defineField, defineType} from 'sanity'

/**
 * Internal document type for the Chat SDK state adapter.
 * Stores thread subscriptions, distributed locks, and cache entries
 * as Content Lake documents with path-based IDs.
 *
 * ID patterns:
 *   chat.state.sub.{threadId}   — subscription
 *   chat.state.lock.{threadId}  — distributed lock
 *   chat.state.cache.{key}      — key-value cache
 *   chat.state.list.{key}       — ordered list
 */
export const chatState = defineType({
  name: 'chat.state',
  title: 'Chat State',
  type: 'document',
  description: 'Internal state document for the Chat SDK (subscriptions, locks, cache).',
  readOnly: true,
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      description: 'Discriminator: subscription, lock, cache, or list.',
      options: {list: ['subscription', 'lock', 'cache', 'list']},
    }),
    defineField({
      name: 'threadId',
      type: 'string',
      description: 'Thread ID for subscription/lock entries.',
    }),
    defineField({
      name: 'lockToken',
      type: 'string',
      description: 'Random UUID identifying the lock holder.',
    }),
    defineField({
      name: 'expiresAt',
      type: 'number',
      description: 'Epoch ms when this lock/cache entry expires.',
    }),
    defineField({
      name: 'value',
      type: 'text',
      description: 'JSON-serialized value for cache entries.',
    }),
    defineField({
      name: 'items',
      type: 'array',
      description: 'JSON-serialized items for list entries.',
      of: [{type: 'string'}],
    }),
  ],
})
