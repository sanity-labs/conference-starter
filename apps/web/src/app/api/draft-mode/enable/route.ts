import {client} from '@/sanity/client'
import {token} from '@/sanity/token'
import {defineEnableDraftMode} from 'next-sanity/draft-mode'

export const {GET} = defineEnableDraftMode({
  client: client.withConfig({token}),
})
