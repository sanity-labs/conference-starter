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
    <section className="mx-auto max-w-content px-6 py-12">
      {heading && <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>}
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-8">
        {filtered.map((sponsor) => (
          <li key={sponsor._id}>
            {sponsor.website ? (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block opacity-80 transition-opacity hover:opacity-100"
              >
                {sponsor.logo ? (
                  <SanityImage
                    value={{...sponsor.logo, alt: sponsor.logo.alt || `${sponsor.name} logo`}}
                    width={160}
                    height={80}
                    className="h-12 w-auto object-contain"
                    sizes="160px"
                  />
                ) : (
                  <span className="text-sm font-medium text-text-muted">{sponsor.name}</span>
                )}
              </a>
            ) : sponsor.logo ? (
              <SanityImage
                value={{...sponsor.logo, alt: sponsor.logo.alt || `${sponsor.name} logo`}}
                width={160}
                height={80}
                className="h-12 w-auto object-contain opacity-80"
                sizes="160px"
              />
            ) : (
              <span className="text-sm font-medium text-text-muted">{sponsor.name}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center">
        <Link href="/sponsors" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
          View all sponsors &rarr;
        </Link>
      </p>
    </section>
  )
}
