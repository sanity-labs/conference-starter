import type {DynamicFetchOptions} from '@/sanity/live'
import type {PAGE_QUERY_RESULT} from '@repo/sanity-queries'
import {HeroSection} from './hero-section'
import {RichTextSection} from './rich-text-section'
import {SpeakerGridSection} from './speaker-grid-section'
import {SponsorBarSection} from './sponsor-bar-section'
import {SchedulePreviewSection} from './schedule-preview-section'
import {CtaBlockSection} from './cta-block-section'
import {FaqSection} from './faq-section'

type Sections = NonNullable<NonNullable<PAGE_QUERY_RESULT>['sections']>
type Section = Sections[number]

export function PageSections({
  sections,
  perspective,
  stega,
}: {
  sections: Sections | null
} & DynamicFetchOptions) {
  if (!sections || sections.length === 0) return null

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer
          key={section._key}
          section={section}
          perspective={perspective}
          stega={stega}
        />
      ))}
    </>
  )
}

function SectionRenderer({
  section,
  perspective,
  stega,
}: {section: Section} & DynamicFetchOptions) {
  switch (section._type) {
    case 'hero':
      return (
        <HeroSection
          heading={section.heading}
          subheading={section.subheading}
          backgroundImage={section.backgroundImage}
          cta={section.cta}
        />
      )
    case 'richText':
      return <RichTextSection heading={section.heading} content={section.content} />
    case 'speakerGrid':
      return (
        <SpeakerGridSection
          heading={section.heading}
          limit={section.limit}
          speakers={section.speakers}
        />
      )
    case 'sponsorBar':
      return (
        <SponsorBarSection
          heading={section.heading}
          tiers={section.tiers}
          perspective={perspective}
          stega={stega}
        />
      )
    case 'schedulePreview':
      return (
        <SchedulePreviewSection
          heading={section.heading}
          day={section.day}
          maxSlots={section.maxSlots}
          perspective={perspective}
          stega={stega}
        />
      )
    case 'ctaBlock':
      return (
        <CtaBlockSection heading={section.heading} body={section.body} cta={section.cta} />
      )
    case 'faqSection':
      return <FaqSection heading={section.heading} items={section.items} />
    default:
      return null
  }
}
