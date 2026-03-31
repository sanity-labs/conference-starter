import type {Metadata} from 'next'
import {Suspense} from 'react'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        <Suspense>
          <DynamicShell>{children}</DynamicShell>
        </Suspense>
        <Suspense>
          <DraftModeShell />
        </Suspense>
      </body>
    </html>
  )
}

async function DynamicShell({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  const opts = await getDynamicFetchOptions()
  return (
    <CachedNav perspective={opts.perspective} stega={opts.stega}>
      {children}
    </CachedNav>
  )
}

async function CachedNav({
  children,
  perspective,
  stega,
}: {
  children: React.ReactNode
} & DynamicFetchOptions) {
  'use cache'

  const {data: navData} = await sanityFetch({query: NAV_QUERY, perspective, stega})

  return (
    <>
      {navData && <Header data={navData} />}
      {children}
      {navData && <Footer data={navData} />}
    </>
  )
}

async function DraftModeShell() {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <>
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  )
}
