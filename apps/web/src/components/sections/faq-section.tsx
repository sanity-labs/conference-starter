import {PortableText} from '@/components/portable-text'
import {JsonLd} from '@/components/json-ld'
import type {FAQPage} from 'schema-dts'

interface FaqItem {
  _key: string
  question: string | null
  answer: Array<Record<string, unknown>> | null
}

interface FaqSectionProps {
  heading: string | null
  items: FaqItem[] | null
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

export function FaqSection({heading, items}: FaqSectionProps) {
  if (!items || items.length === 0) return null

  const faqItems = items.filter((item) => item.question)

  return (
    <section className="mx-auto max-w-content px-6 py-12">
      {faqItems.length > 0 && (
        <JsonLd<FAQPage>
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.question!,
              acceptedAnswer: {
                '@type': 'Answer',
                text: blocksToPlainText(item.answer),
              },
            })),
          }}
        />
      )}
      {heading && <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>}
      <div className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <details key={item._key} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between font-medium">
              {item.question}
              <span className="ml-2 shrink-0 text-text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="prose mt-3 max-w-none text-text-secondary">
              <PortableText value={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
