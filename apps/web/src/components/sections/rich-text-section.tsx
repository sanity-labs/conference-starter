import {PortableText} from '@/components/portable-text'

interface RichTextSectionProps {
  heading: string | null
  content: Array<Record<string, unknown>> | null
}

export function RichTextSection({heading, content}: RichTextSectionProps) {
  return (
    <section>
      {heading && <h2>{heading}</h2>}
      {content && (
        <div className="prose">
          <PortableText value={content} />
        </div>
      )}
    </section>
  )
}
