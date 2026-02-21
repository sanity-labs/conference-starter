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
    <section>
      {heading && <h2>{heading}</h2>}
      <ul>
        {displayed.map((speaker) => (
          <li key={speaker._id}>
            <Link href={`/speakers/${speaker.slug}`}>
              {speaker.photo && (
                <SanityImage value={speaker.photo} width={200} height={200} />
              )}
              <p>{speaker.name}</p>
              {speaker.role && <p>{speaker.role}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
