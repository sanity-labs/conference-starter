import {createImageUrlBuilder} from '@sanity/image-url'
import {client} from './client'

const imageBuilder = createImageUrlBuilder(client)

export function urlForImage(
  source: {asset?: {_ref?: string; _type?: string} | null} | null | undefined,
) {
  if (!source?.asset?._ref) return null
  return imageBuilder.image(source)
}
