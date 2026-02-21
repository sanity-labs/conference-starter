import Link from 'next/link'
import {sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {SPONSORS_QUERY} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'

interface SponsorBarSectionProps {
  heading: string | null
  tiers: string[] | null
  perspective: DynamicFetchOptions['perspective']
  stega: DynamicFetchOptions['stega']
}

export async function SponsorBarSection({
  heading,
  tiers,
  perspective,
  stega,
}: SponsorBarSectionProps) {
  const {data: sponsors} = await sanityFetch({query: SPONSORS_QUERY, perspective, stega})

  if (!sponsors || sponsors.length === 0) return null

  const filtered = tiers && tiers.length > 0
    ? sponsors.filter((s) => s.tier && tiers.includes(s.tier))
    : sponsors

  if (filtered.length === 0) return null

  return (
    <section>
      {heading && <h2>{heading}</h2>}
      <ul>
        {filtered.map((sponsor) => (
          <li key={sponsor._id}>
            {sponsor.website ? (
              <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                {sponsor.logo ? (
                  <SanityImage value={sponsor.logo} width={160} height={80} />
                ) : (
                  <span>{sponsor.name}</span>
                )}
              </a>
            ) : sponsor.logo ? (
              <SanityImage value={sponsor.logo} width={160} height={80} />
            ) : (
              <span>{sponsor.name}</span>
            )}
          </li>
        ))}
      </ul>
      <p>
        <Link href="/sponsors">View all sponsors</Link>
      </p>
    </section>
  )
}
