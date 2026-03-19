import {Suspense} from 'react'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {SPONSORS_QUERY} from '@repo/sanity-queries'
import type {SPONSORS_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'

export const metadata: Metadata = {
  title: 'Sponsors',
  description: 'The companies and communities making Everything NYC 2026 possible.',
}

export default function SponsorsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sponsors</h1>
      <Suspense>
        <SponsorsListDynamic />
      </Suspense>
    </main>
  )
}

async function SponsorsListDynamic() {
  const opts = await getDynamicFetchOptions()
  return <SponsorsListCached {...opts} />
}

async function SponsorsListCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: sponsors} = await sanityFetch({query: SPONSORS_QUERY, perspective, stega})

  if (!sponsors || sponsors.length === 0) {
    return <p className="mt-8 text-gray-500">No sponsors announced yet.</p>
  }

  const tiers = groupByTier(sponsors)

  return (
    <div className="mt-8 space-y-12">
      {tiers.map(({tier, label, sponsors: tierSponsors}) => (
        <section key={tier}>
          <h2 className="text-2xl font-bold">{label}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {tierSponsors.map((sponsor) => (
              <li key={sponsor._id}>
                <SponsorCard sponsor={sponsor} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

type Sponsor = NonNullable<SPONSORS_QUERY_RESULT>[number]

function SponsorCard({sponsor}: {sponsor: Sponsor}) {
  const content = (
    <>
      {sponsor.logo && (
        <SanityImage
          value={sponsor.logo}
          className="h-16 w-auto object-contain"
          width={200}
          height={100}
        />
      )}
      <p className="mt-2 font-medium">{sponsor.name}</p>
      {sponsor.description && (
        <div className="mt-1 text-sm text-gray-600">
          <PortableText value={sponsor.description} />
        </div>
      )}
    </>
  )

  if (sponsor.website) {
    return (
      <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}

const TIER_LABELS: Record<string, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  community: 'Community',
}

function groupByTier(sponsors: NonNullable<SPONSORS_QUERY_RESULT>) {
  const groups: Array<{tier: string; label: string; sponsors: typeof sponsors}> = []
  const seen = new Set<string>()

  for (const sponsor of sponsors) {
    const tier = sponsor.tier || 'community'
    if (!seen.has(tier)) {
      seen.add(tier)
      groups.push({tier, label: TIER_LABELS[tier] || tier, sponsors: []})
    }
    groups.find((g) => g.tier === tier)!.sponsors.push(sponsor)
  }

  return groups
}
