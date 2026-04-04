import Link from 'next/link'

interface TrackBadgeProps {
  name: string | null
  slug: string | null
  color?: {hex?: string | null} | null
  linked?: boolean
}

export function TrackBadge({name, slug, color, linked = true}: TrackBadgeProps) {
  if (!name) return null

  const hex = color?.hex
  const style = hex
    ? {
        backgroundColor: `${hex}14`,
        color: hex,
        borderColor: `${hex}30`,
      }
    : undefined

  const className = [
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
    hex ? '' : 'border-border bg-surface-muted text-text-secondary',
  ]
    .filter(Boolean)
    .join(' ')

  if (linked && slug) {
    return (
      <Link href={`/sessions?track=${slug}`} className={className} style={style}>
        {name}
      </Link>
    )
  }

  return (
    <span className={className} style={style}>
      {name}
    </span>
  )
}
