import {Suspense} from 'react'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CFP_CONFIG_QUERY} from '@repo/sanity-queries'
import type {CFP_CONFIG_QUERY_RESULT} from '@repo/sanity-queries'
import {PortableText} from '@/components/portable-text'
import {CfpForm} from './cfp-form'

export const metadata: Metadata = {
  title: 'Call for Papers — Everything NYC 2026',
  description: 'Submit your talk proposal for Everything NYC 2026.',
}

export default function CfpPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Call for Papers</h1>
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
    return <p className="mt-8 text-gray-500">Conference information not available.</p>
  }

  const isPastDeadline = config.cfpDeadline ? new Date(config.cfpDeadline) < new Date() : false
  const isOpen = Boolean(config.cfpOpen) && !isPastDeadline

  return (
    <>
      <CfpStatus config={config} isOpen={isOpen} />
      {config.cfpGuidelines && (
        <section className="prose mt-8">
          <PortableText value={config.cfpGuidelines} />
        </section>
      )}
      {isOpen ? (
        <CfpForm />
      ) : (
        <p className="mt-8 text-gray-500">
          The Call for Papers is currently closed.
          {config.cfpDeadline &&
            !isPastDeadline &&
            ` It opens soon — check back before ${new Date(config.cfpDeadline).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}.`}
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
        <dd>{isOpen ? 'Open for submissions' : 'Closed'}</dd>
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
              })}
            </time>
          </dd>
        </div>
      )}
    </dl>
  )
}
