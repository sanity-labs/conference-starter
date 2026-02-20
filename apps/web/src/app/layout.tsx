import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '@/sanity/live'
import {JsonLd} from '@/components/json-ld'
import type {WebSite} from 'schema-dts'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://everything-nyc.sanity.dev'

export const metadata: Metadata = {
  title: 'Everything NYC 2026',
  description:
    'Where developers and creative thinkers explore what it means to build digital experiences that move people forward.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <CachedLayout
      live={<SanityLive key="live" />}
      visualEditing={isDraftMode && <VisualEditing key="visual-editing" />}
    >
      {children}
    </CachedLayout>
  )
}

async function CachedLayout({
  children,
  live,
  visualEditing,
}: {
  children: React.ReactNode
  live: React.ReactNode
  visualEditing: React.ReactNode
}) {
  'use cache'
  return (
    <html lang="en">
      <head>
        <JsonLd<WebSite>
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Everything NYC 2026',
            url: SITE_URL,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
        {live}
        {visualEditing}
      </body>
    </html>
  )
}
