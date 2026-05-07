'use client'

import {LogoSoup} from '@sanity-labs/logo-soup/react'

export type SponsorSoupItem = {
  id: string
  name: string
  src: string
  alt?: string
}

export function SponsorSoup({
  items,
  baseSize = 56,
  gap = 36,
}: {
  items: SponsorSoupItem[]
  baseSize?: number
  gap?: number
}) {
  if (items.length === 0) return null

  return (
    <LogoSoup
      logos={items.map((item) => ({src: item.src, alt: item.alt ?? item.name}))}
      baseSize={baseSize}
      gap={gap}
      alignBy="visual-center-y"
      style={{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        rowGap: 'clamp(1rem, 3vmin, 3rem)',
      }}
    />
  )
}
