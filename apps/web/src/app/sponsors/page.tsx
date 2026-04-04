import {Suspense} from 'react'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {SPONSORS_QUERY} from '@repo/sanity-queries'
import type {SPONSORS_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'
import {PortableText} from '@/components/portable-text'
import {createMetadata} from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Sponsors',
  description:
    'The companies and communities making this conference possible.',
  path: '/sponsors',
})

export default function SponsorsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-max px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Sponsors</h1>
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
    return <p className="mt-8 text-text-muted">No sponsors announced yet.</p>
  }

  const tiers = groupByTier(sponsors)

  return (
    <div className="mt-8 space-y-12">
      {tiers.map(({tier, label, sponsors: tierSponsors}) => (
        <section key={tier}>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{label}</h2>
          <ul className={`mt-4 ${tierGridClass(tier)}`}>
            {tierSponsors.map((sponsor) => (
              <li key={sponsor._id} id={sponsor.slug ?? undefined}>
                <SponsorCard sponsor={sponsor} tier={tier} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function tierGridClass(tier: string): string {
  switch (tier) {
    case 'platinum':
      return 'grid grid-cols-1 gap-8 sm:grid-cols-2'
    case 'gold':
      return 'grid grid-cols-2 gap-6 sm:grid-cols-3'
    case 'silver':
      return 'grid grid-cols-2 gap-4 sm:grid-cols-4'
    case 'bronze':
      return 'grid grid-cols-3 gap-3 sm:grid-cols-5'
    case 'community':
      return 'grid grid-cols-3 gap-3 sm:grid-cols-5'
    default:
      return 'grid grid-cols-2 gap-6 sm:grid-cols-3'
  }
}

function tierLogoHeight(tier: string): string {
  switch (tier) {
    case 'platinum':
      return 'h-24'
    case 'gold':
      return 'h-16'
    case 'silver':
      return 'h-12'
    case 'bronze':
      return 'h-10'
    case 'community':
      return 'h-8'
    default:
      return 'h-16'
  }
}

type Sponsor = NonNullable<SPONSORS_QUERY_RESULT>[number]

function SponsorCard({sponsor, tier}: {sponsor: Sponsor; tier: string}) {
  const logoHeight = tierLogoHeight(tier)
  const content = (
    <div className="flex flex-col items-center rounded-md border border-border p-4 text-center transition-colors hover:border-border-strong">
      {sponsor.logo && (
        <SanityImage
          value={{...sponsor.logo, alt: sponsor.logo.alt || `${sponsor.name} logo`}}
          className={`${logoHeight} w-auto object-contain`}
          width={200}
          height={100}
          sizes="200px"
        />
      )}
      <p className="mt-2 text-sm font-medium">{sponsor.name}</p>
      {tier === 'platinum' && sponsor.description && (
        <div className="mt-1 text-xs text-text-muted">
          <PortableText value={sponsor.description} />
        </div>
      )}
    </div>
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
