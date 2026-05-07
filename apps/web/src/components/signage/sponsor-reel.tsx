import {sanityFetch} from '@/sanity/live'
import {CONFERENCE_QUERY, SIGNAGE_SPONSORS_QUERY} from '@repo/sanity-queries'
import type {SIGNAGE_DISPLAY_QUERY_RESULT, SIGNAGE_SPONSORS_QUERY_RESULT} from '@repo/sanity-queries'
import {urlForImage} from '@/sanity/image'
import {Stage} from './stage'
import {Carousel} from './carousel'

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>
type Sponsor = SIGNAGE_SPONSORS_QUERY_RESULT[number]

const TIER_LABELS: Record<string, string> = {
  platinum: 'Platinum sponsor',
  gold: 'Gold sponsor',
  silver: 'Silver sponsor',
  bronze: 'Bronze sponsor',
  community: 'Community partner',
}

export async function SponsorReel({display, hideChrome}: {display: Display; hideChrome: boolean}) {
  const [{data: conference}, {data: sponsorsData}] = await Promise.all([
    sanityFetch({query: CONFERENCE_QUERY, perspective: 'published', stega: false}),
    sanityFetch({query: SIGNAGE_SPONSORS_QUERY, perspective: 'published', stega: false}),
  ])

  const sponsors = (sponsorsData ?? []) as Sponsor[]

  if (sponsors.length === 0) {
    return (
      <Stage
        conferenceName={conference?.name}
        showClock={display.showClock !== false}
        showConferenceBranding={display.showConferenceBranding !== false}
        hideChrome={hideChrome}
      >
        <p className="signage-meta">No sponsors yet.</p>
      </Stage>
    )
  }

  const items = sponsors.map((sponsor) => <SponsorFrame key={sponsor._id} sponsor={sponsor} />)

  return (
    <Stage
      conferenceName={conference?.name}
      conferenceTagline="Made possible by"
      showClock={display.showClock !== false}
      showConferenceBranding={display.showConferenceBranding !== false}
      hideChrome={hideChrome}
    >
      <Carousel
        items={items}
        dwellSeconds={display.dwellSeconds ?? 8}
        transition={(display.transition as 'fade' | 'slide' | 'none') ?? 'fade'}
      />
    </Stage>
  )
}

function SponsorFrame({sponsor}: {sponsor: Sponsor}) {
  const url = urlForImage(sponsor.logo)?.width(1600).height(900).fit('max').url() ?? null
  const tierLabel = TIER_LABELS[(sponsor.tier as string) ?? ''] ?? 'Sponsor'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(1rem, 2.5vmin, 3rem)',
        padding: 'clamp(2rem, 6vmin, 6rem)',
        textAlign: 'center',
      }}
    >
      <p className="signage-eyebrow">{tierLabel}</p>
      {url ? (
        <img
          src={url}
          alt={sponsor.logo?.alt ?? sponsor.name ?? ''}
          style={{
            maxWidth: '70vmin',
            maxHeight: '50vmin',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      ) : (
        <h2 className="signage-title">{sponsor.name}</h2>
      )}
      <p className="signage-meta" style={{fontWeight: 500}}>
        {sponsor.name}
      </p>
    </div>
  )
}
