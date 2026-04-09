import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {getPublishedId} from '@sanity/id-utils'

export const handler = documentEventHandler<{_id: string}>(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: '2026-04-01',
    perspective: 'raw',
    useCdn: false,
  })
  const publishedId = String(getPublishedId(event.data._id))
  const internalId = `personInternal.${publishedId}`
  const dataset = context.clientOptions.dataset

  // Check if any version of the person still exists (handles unpublish case)
  const hasOtherVersions = await client
    .request<{documents: Array<{_id: string}>}>({
      method: 'GET',
      uri: `/data/doc/${dataset}/${publishedId}?includeAllVersions=true`,
    })
    .then((res) => res.documents.length > 0)
    .catch(() => false)

  if (!hasOtherVersions) {
    await client.delete(internalId).catch(() => {})
    console.log(`Deleted personInternal ${internalId} — person ${publishedId} fully removed`)
  } else {
    console.log(`Skipped delete of ${internalId} — person ${publishedId} still has other versions`)
  }
})
