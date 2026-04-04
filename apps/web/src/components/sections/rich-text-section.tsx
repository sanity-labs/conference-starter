import {PortableText} from '@/components/portable-text'

interface RichTextSectionProps {
  heading: string | null
  content: Array<Record<string, unknown>> | null
}

export function RichTextSection({heading, content}: RichTextSectionProps) {
  return (
    <section className="mx-auto max-w-content px-6 py-12">
      {heading && <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>}
      {content && (
        <div className="prose mt-4 max-w-none">
          <PortableText value={content} />
        </div>
      )}
    </section>
  )
}
