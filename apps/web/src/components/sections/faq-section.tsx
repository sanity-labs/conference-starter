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
    <section>
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
      {heading && <h2>{heading}</h2>}
      <dl>
        {items.map((item) => (
          <div key={item._key}>
            <dt>{item.question}</dt>
            <dd>
              <PortableText value={item.answer} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
