import {defineField, defineType} from 'sanity'

/**
 * Internal document type for the Chat SDK state adapter and web rate limiter.
 * Stores thread subscriptions, distributed locks, cache entries, and
 * rate-limit counters as Content Lake documents with path-based IDs.
 *
 * ID patterns:
 *   chat.state.sub.{threadId}         — subscription
 *   chat.state.lock.{threadId}        — distributed lock
 *   chat.state.cache.{key}            — key-value cache
 *   chat.state.list.{key}             — ordered list
 *   chat.state.ratelimit.{hashed-ip}  — rate-limit counter window
 */
export const chatState = defineType({
  name: 'chat.state',
  title: 'Chat State',
  type: 'document',
  description:
    'Internal state document for the Chat SDK (subscriptions, locks, cache) and web rate limiter.',
  readOnly: true,
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      description: 'Discriminator: subscription, lock, cache, list, or ratelimit.',
      options: {list: ['subscription', 'lock', 'cache', 'list', 'ratelimit']},
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
    defineField({
      name: 'count',
      type: 'number',
      description: 'Request counter for rate-limit entries.',
    }),
  ],
})
