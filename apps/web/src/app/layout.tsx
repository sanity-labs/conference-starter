import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive, getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {NAV_QUERY} from '@repo/sanity-queries'
import {Header} from '@/components/header'
import {Footer} from '@/components/footer'
import {JsonLd} from '@/components/json-ld'
import type {WebSite} from 'schema-dts'
import {SITE_URL, SITE_NAME, getDefaultOgImage} from '@/lib/metadata'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = await getDefaultOgImage()
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s — ${SITE_NAME}`,
    },
    description:
      'Where developers and creative thinkers explore what it means to build digital experiences that move people forward.',
    openGraph: {
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website',
      ...(ogImage && {images: [{url: ogImage, width: 1200, height: 630}]}),
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {isEnabled: isDraftMode} = await draftMode()
  const opts = await getDynamicFetchOptions()
  return (
    <CachedLayout
      live={<SanityLive key="live" />}
      visualEditing={isDraftMode && <VisualEditing key="visual-editing" />}
      perspective={opts.perspective}
      stega={opts.stega}
    >
      {children}
    </CachedLayout>
  )
}

async function CachedLayout({
  children,
  live,
  visualEditing,
  perspective,
  stega,
}: {
  children: React.ReactNode
  live: React.ReactNode
  visualEditing: React.ReactNode
} & DynamicFetchOptions) {
  'use cache'

  const {data: navData} = await sanityFetch({query: NAV_QUERY, perspective, stega})

  return (
    <html lang="en">
      <head>
        <JsonLd<WebSite>
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {navData && <Header data={navData} />}
        {children}
        {navData && <Footer data={navData} />}
        {live}
        {visualEditing}
      </body>
    </html>
  )
}
