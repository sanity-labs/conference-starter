import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {sanityFetch} from '@/sanity/live'
import {SIGNAGE_DISPLAYS_INDEX_QUERY} from '@repo/sanity-queries'

export const metadata: Metadata = {
  title: 'Signage Displays',
  robots: {index: false, follow: false},
}

export default function SignageIndexPage() {
  return (
    <main className="signage-stage" data-theme="dark">
      <div className="signage-chrome">
        <span className="signage-chrome-name">Signage</span>
        <span className="signage-chrome-clock">Operator index</span>
      </div>
      <div className="signage-body" style={{alignItems: 'flex-start', overflow: 'auto'}}>
        <Suspense fallback={<p className="signage-meta">Loading displays…</p>}>
          <DisplayList />
        </Suspense>
      </div>
      <div className="signage-footer">
        <span>This page is for staff. Point each TV at one of the URLs below.</span>
      </div>
    </main>
  )
}

async function DisplayList() {
  'use cache'
  const {data} = await sanityFetch({
    query: SIGNAGE_DISPLAYS_INDEX_QUERY,
    perspective: 'published',
    stega: false,
  })

  if (!data || data.length === 0) {
    return (
      <p className="signage-meta">
        No signage displays configured yet. Add one in Studio under <strong>Signage</strong>.
      </p>
    )
  }

  return (
    <ul style={{width: '100%', display: 'grid', gap: '1rem', listStyle: 'none', padding: 0, margin: 0}}>
      {data.map((display) => {
        const kindLabel = (display.kind ?? 'unconfigured').replace('-', ' ')
        const status = display.active === false ? 'paused' : 'active'
        return (
          <li
            key={display._id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              padding: '1rem 1.25rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.75rem',
              background: 'var(--color-surface-alt)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline'}}>
              <strong style={{fontSize: 'clamp(1.125rem, 1.8vmin, 1.5rem)'}}>{display.name}</strong>
              <span
                style={{
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color:
                    status === 'active' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {status}
              </span>
            </div>
            <div className="signage-meta" style={{fontSize: '0.95rem'}}>
              {kindLabel}
              {display.room?.name ? ` · ${display.room.name}` : ''}
            </div>
            {display.slug && (
              <Link
                href={`/signage/${display.slug}`}
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.875rem',
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                }}
              >
                /signage/{display.slug}
              </Link>
            )}
            {display.notes && (
              <p style={{fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0'}}>
                {display.notes}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
