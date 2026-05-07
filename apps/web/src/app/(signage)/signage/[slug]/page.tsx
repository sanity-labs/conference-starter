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
import {parseDemoOptions, isDemoActive, type DemoOptions} from '@/components/signage/demo'

export const metadata: Metadata = {
  robots: {index: false, follow: false},
}

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>

type PageProps = {
  params: Promise<{slug: string}>
  searchParams: Promise<{chrome?: string; at?: string; lookahead?: string}>
}

export default async function SignageDisplayPage({params, searchParams}: PageProps) {
  const {slug} = await params
  const {chrome, at, lookahead} = await searchParams
  const demo = parseDemoOptions({at, lookahead})
  return (
    <Suspense fallback={<StageShell theme="dark" />}>
      <DisplayLoader slug={slug} hideChrome={chrome === 'hide'} demo={demo} />
    </Suspense>
  )
}

async function DisplayLoader({
  slug,
  hideChrome,
  demo,
}: {
  slug: string
  hideChrome: boolean
  demo: DemoOptions
}) {
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

  const announcementMode = resolveAnnouncementMode(display)
  const isDemo = isDemoActive(demo)
  return (
    <>
      <AnnouncementOverlay mode={announcementMode} />
      <main
        className="signage-stage"
        data-theme={display.theme ?? 'dark'}
        data-orientation={display.orientation ?? 'landscape'}
        data-kind={display.kind ?? 'unknown'}
        data-demo={isDemo ? 'true' : undefined}
      >
        <DisplayBody display={display} hideChrome={hideChrome} demo={demo} />
        {isDemo && <DemoBadge demo={demo} />}
      </main>
    </>
  )
}

function DemoBadge({demo}: {demo: DemoOptions}) {
  const parts: string[] = []
  if (demo.demoNowISO) {
    const date = new Date(demo.demoNowISO)
    if (!Number.isNaN(date.getTime())) {
      parts.push(
        date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        }),
      )
    }
  }
  if (demo.demoLookaheadMinutes !== null) {
    parts.push(`lookahead ${demo.demoLookaheadMinutes}m`)
  }
  return (
    <div className="signage-demo-badge" aria-hidden>
      <span>Demo</span>
      {parts.length > 0 && <span>{parts.join(' · ')}</span>}
    </div>
  )
}

function DisplayBody({
  display,
  hideChrome,
  demo,
}: {
  display: Display
  hideChrome: boolean
  demo: DemoOptions
}) {
  switch (display.kind) {
    case 'now-next':
      return <NowNext display={display} hideChrome={hideChrome} demo={demo} />
    case 'day-agenda':
      return <DayAgenda display={display} hideChrome={hideChrome} demo={demo} />
    case 'sponsor-reel':
      return <SponsorReel display={display} hideChrome={hideChrome} />
    case 'speaker-spotlight':
      return <SpeakerSpotlight display={display} hideChrome={hideChrome} demo={demo} />
    case 'hallway-carousel':
      return <HallwayCarousel display={display} hideChrome={hideChrome} demo={demo} />
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

type AnnouncementMode = 'none' | 'banner' | 'takeover'

function resolveAnnouncementMode(display: Display): AnnouncementMode {
  const mode = display.announcementMode
  if (mode === 'none' || mode === 'takeover' || mode === 'banner') return mode
  // Back-compat with the previous boolean field. Pre-migration documents
  // expressed "do not interrupt" as showAnnouncementOverlay: false.
  if (display.legacyShowAnnouncementOverlay === false) return 'none'
  return 'banner'
}

