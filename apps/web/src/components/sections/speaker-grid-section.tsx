import Link from 'next/link'
import {SanityImage} from '@/components/sanity-image'

interface Speaker {
  _id: string
  name: string | null
  slug: string | null
  role: string | null
  photo: {
    asset?: {_ref?: string; _type?: string} | null
    alt?: string | null
    hotspot?: {x?: number; y?: number} | null
    crop?: {top?: number; bottom?: number; left?: number; right?: number} | null
  } | null
}

interface SpeakerGridSectionProps {
  heading: string | null
  limit: number | null
  speakers: Speaker[] | null
}

export function SpeakerGridSection({heading, limit, speakers}: SpeakerGridSectionProps) {
  if (!speakers || speakers.length === 0) return null

  const displayed = limit ? speakers.slice(0, limit) : speakers

  return (
    <section className="mx-auto max-w-content px-6 py-12">
      {heading && <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>}
      <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {displayed.map((speaker) => (
          <li key={speaker._id} className="group">
            <Link href={`/speakers/${speaker.slug}`}>
              {speaker.photo && (
                <SanityImage
                  value={{...speaker.photo, alt: speaker.photo.alt || speaker.name}}
                  width={400}
                  height={400}
                  className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
                  sizes="(min-width: 640px) 25vw, 50vw"
                />
              )}
              <p className="mt-2 font-medium">{speaker.name}</p>
              {speaker.role && <p className="text-sm text-text-muted">{speaker.role}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
