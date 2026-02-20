import {PortableText as PortableTextReact} from '@portabletext/react'
import type {PortableTextBlock} from '@portabletext/types'

type PortableTextValue = PortableTextBlock[] | Array<Record<string, unknown>>

export function PortableText({value}: {value: PortableTextValue | null | undefined}) {
  if (!value) return null
  return <PortableTextReact value={value as PortableTextBlock[]} />
}
