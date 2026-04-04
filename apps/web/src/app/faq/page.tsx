import {Suspense} from 'react'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {FAQ_QUERY} from '@repo/sanity-queries'
import type {FAQ_QUERY_RESULT} from '@repo/sanity-queries'
import {PortableText} from '@/components/portable-text'
import {JsonLd} from '@/components/json-ld'
import type {FAQPage} from 'schema-dts'
import {createMetadata} from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'FAQ',
  description:
    'Frequently asked questions — venue, schedule, registration, accessibility, and more.',
  path: '/faq',
})

export default function FaqPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-wide px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
        Frequently Asked Questions
      </h1>
      <Suspense>
        <FaqDynamic />
      </Suspense>
    </main>
  )
}

async function FaqDynamic() {
  const opts = await getDynamicFetchOptions()
  return <FaqCached {...opts} />
}

async function FaqCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: faqs} = await sanityFetch({query: FAQ_QUERY, perspective, stega})

  if (!faqs || faqs.length === 0) {
    return <p className="mt-8 text-text-muted">No FAQs available yet.</p>
  }

  // Group by category
  const grouped = groupByCategory(faqs)
  const allFaqs = faqs.filter((f) => f.question)

  return (
    <>
      {allFaqs.length > 0 && (
        <JsonLd<FAQPage>
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allFaqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question!,
              acceptedAnswer: {
                '@type': 'Answer',
                text: blocksToPlainText(faq.answer),
              },
            })),
          }}
        />
      )}
      <div className="mt-8 space-y-10">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {categoryLabel(category)}
            </h2>
            <div className="mt-3 divide-y divide-border">
              {items.map((faq) => (
                <details key={faq._id} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    {faq.question}
                    <span className="ml-2 shrink-0 text-text-muted transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="prose mt-3 max-w-none text-text-secondary">
                    <PortableText value={faq.answer} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

function groupByCategory(
  faqs: FAQ_QUERY_RESULT,
): Array<[string, FAQ_QUERY_RESULT]> {
  const map = new Map<string, FAQ_QUERY_RESULT>()
  for (const faq of faqs) {
    const cat = faq.category ?? 'general'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(faq)
  }
  return Array.from(map.entries())
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  venue: 'Venue',
  schedule: 'Schedule',
  registration: 'Registration',
  accessibility: 'Accessibility',
  conduct: 'Code of Conduct',
  speakers: 'Speakers',
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1)
}

function blocksToPlainText(blocks: Array<Record<string, unknown>> | null): string {
  if (!blocks) return ''
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !Array.isArray(block.children)) return ''
      return (block.children as Array<{text?: string}>).map((c) => c.text ?? '').join('')
    })
    .filter(Boolean)
    .join('\n')
}
