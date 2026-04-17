import Link from 'next/link'

interface TrackBadgeProps {
  name: string | null
  slug: string | null
  color?: {hex?: string | null} | null
  linked?: boolean
}

// YIQ brightness — picks readable text color for any track hex an editor sets.
// Returns white for dark backgrounds, near-black for light ones.
function textOnColor(hex: string): 'white' | 'dark' {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 140 ? 'dark' : 'white'
}

export function TrackBadge({name, slug, color, linked = true}: TrackBadgeProps) {
  if (!name) return null

  const hex = color?.hex
  const fg = hex ? (textOnColor(hex) === 'white' ? '#ffffff' : '#0c0a09') : undefined

  // Asymmetric padding per uidotsh://ui/design-guidelines/badges:
  // left padding (icon side) equals vertical padding.
  const className = [
    'inline-flex items-center gap-1.5 rounded-full py-1 pr-2 pl-1 text-xs font-medium',
    hex ? '' : 'border border-border bg-surface-muted text-text-secondary',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full"
        style={hex ? {backgroundColor: fg, opacity: 0.9} : {backgroundColor: 'currentColor'}}
      />
      {name}
    </>
  )

  const style = hex ? {backgroundColor: hex, color: fg} : undefined

  if (linked && slug) {
    return (
      <Link href={`/sessions?track=${slug}`} className={className} style={style}>
        {content}
      </Link>
    )
  }

  return (
    <span className={className} style={style}>
      {content}
    </span>
  )
}
