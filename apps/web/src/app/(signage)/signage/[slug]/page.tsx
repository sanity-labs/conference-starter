import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import type {Metadata} from 'next'
import {sanityFetch} from '@/sanity/live'
import {SIGNAGE_DISPLAY_QUERY} from '@repo/sanity-queries'
import type {SIGNAGE_DISPLAY_QUERY_RESULT} from '@repo/sanity-queries'
import {NowNext} from '@/components/signage/now-next'
import {DayAgenda} from '@/components/signage/day-agenda'
import {SponsorReel} from '@/components/signage/sponsor-reel'
import {SpeakerSpotlight} from '@/components/signage/speaker-spotlight'
import {HallwayCarousel} from '@/components/signage/hallway-carousel'
import {WelcomeHero} from '@/components/signage/welcome-hero'
import {AnnouncementOverlay} from '@/components/signage/announcement-overlay'

export const metadata: Metadata = {
  robots: {index: false, follow: false},
}

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>

type PageProps = {
  params: Promise<{slug: string}>
  searchParams: Promise<{chrome?: string}>
}

export default async function SignageDisplayPage({params, searchParams}: PageProps) {
  const {slug} = await params
  const {chrome} = await searchParams
  return (
    <Suspense fallback={<StageShell theme="dark" />}>
      <DisplayLoader slug={slug} hideChrome={chrome === 'hide'} />
    </Suspense>
  )
}

async function DisplayLoader({slug, hideChrome}: {slug: string; hideChrome: boolean}) {
  'use cache'
  const {data} = await sanityFetch({
    query: SIGNAGE_DISPLAY_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })

  if (!data) notFound()

  const display = data as Display

  if (display.active === false) {
    return (
      <main className="signage-stage" data-theme={display.theme ?? 'dark'}>
        <div className="signage-paused">
          <p className="signage-eyebrow">{display.name}</p>
          <h1 className="signage-title">This display is paused</h1>
          <p className="signage-meta">Reactivate it in Studio when you're ready.</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="signage-stage"
      data-theme={display.theme ?? 'dark'}
      data-orientation={display.orientation ?? 'landscape'}
      data-kind={display.kind ?? 'unknown'}
    >
      <DisplayBody display={display} hideChrome={hideChrome} />
      {display.showAnnouncementOverlay !== false && <AnnouncementOverlay />}
    </main>
  )
}

function DisplayBody({display, hideChrome}: {display: Display; hideChrome: boolean}) {
  switch (display.kind) {
    case 'now-next':
      return <NowNext display={display} hideChrome={hideChrome} />
    case 'day-agenda':
      return <DayAgenda display={display} hideChrome={hideChrome} />
    case 'sponsor-reel':
      return <SponsorReel display={display} hideChrome={hideChrome} />
    case 'speaker-spotlight':
      return <SpeakerSpotlight display={display} hideChrome={hideChrome} />
    case 'hallway-carousel':
      return <HallwayCarousel display={display} hideChrome={hideChrome} />
    case 'welcome-hero':
      return <WelcomeHero display={display} hideChrome={hideChrome} />
    default:
      return (
        <div className="signage-paused">
          <h1 className="signage-title">Unknown display kind</h1>
          <p className="signage-meta">Pick a kind for "{display.name}" in Studio.</p>
        </div>
      )
  }
}

function StageShell({theme}: {theme: 'dark' | 'light'}) {
  return <main className="signage-stage" data-theme={theme} />
}
