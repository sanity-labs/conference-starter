import {PortableText} from '@/components/portable-text'

interface FaqItem {
  _key: string
  question: string | null
  answer: Array<Record<string, unknown>> | null
}

interface FaqSectionProps {
  heading: string | null
  items: FaqItem[] | null
}

export function FaqSection({heading, items}: FaqSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section>
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
