import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {getPublishedId} from '@sanity/id-utils'

export const handler = documentEventHandler<{_id: string}>(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: '2026-04-01',
  })
  const publishedId = String(getPublishedId(event.data._id))
  const internalId = `personInternal.${publishedId}`

  await client.createIfNotExists({
    _id: internalId,
    _type: 'personInternal',
    person: {_type: 'reference', _ref: publishedId, _weak: true},
  })

  console.log(`Created personInternal ${internalId} for person ${publishedId}`)
})
