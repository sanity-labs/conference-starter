import {Suspense} from 'react'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CFP_CONFIG_QUERY} from '@repo/sanity-queries'
import type {CFP_CONFIG_QUERY_RESULT} from '@repo/sanity-queries'
import {PortableText} from '@/components/portable-text'
import {CfpForm} from './cfp-form'
import {createMetadata} from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Call for Papers',
  description:
    'Submit your talk proposal. We welcome talks on structured content, AI, and developer experience.',
  path: '/cfp',
})

export default function CfpPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-wide px-6 py-16 lg:px-8 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Call for Papers</h1>
      <Suspense>
        <CfpContentDynamic />
      </Suspense>
    </main>
  )
}

async function CfpContentDynamic() {
  const opts = await getDynamicFetchOptions()
  return <CfpContentCached {...opts} />
}

async function CfpContentCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: config} = await sanityFetch({
    query: CFP_CONFIG_QUERY,
    perspective,
    stega,
  })

  if (!config) {
    return <p className="mt-8 text-text-muted">Conference information not available.</p>
  }

  const isPastDeadline = config.cfpDeadline ? new Date(config.cfpDeadline) < new Date() : false
  const isOpen = Boolean(config.cfpOpen) && !isPastDeadline

  return (
    <>
      <CfpStatus config={config} isOpen={isOpen} />
      {config.cfpGuidelines && (
        <section className="prose mt-8 max-w-prose">
          <PortableText value={config.cfpGuidelines} />
        </section>
      )}
      {isOpen ? (
        <CfpForm />
      ) : (
        <p className="mt-8 text-text-muted">
          The Call for Papers is currently closed.
          {config.cfpDeadline &&
            !isPastDeadline &&
            ` It opens soon — check back before ${new Date(config.cfpDeadline).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York'})}.`}
        </p>
      )}
    </>
  )
}

function CfpStatus({
  config,
  isOpen,
}: {
  config: NonNullable<CFP_CONFIG_QUERY_RESULT>
  isOpen: boolean
}) {
  return (
    <dl className="mt-6 space-y-2 text-sm">
      <div className="flex gap-2">
        <dt className="font-medium">Status:</dt>
        <dd className={isOpen ? 'font-medium text-accent' : 'text-text-muted'}>
          {isOpen ? 'Open for submissions' : 'Closed'}
        </dd>
      </div>
      {config.cfpDeadline && (
        <div className="flex gap-2">
          <dt className="font-medium">Deadline:</dt>
          <dd>
            <time dateTime={config.cfpDeadline}>
              {new Date(config.cfpDeadline).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'America/New_York',
              })}
            </time>
          </dd>
        </div>
      )}
    </dl>
  )
}
