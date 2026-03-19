import Image from 'next/image'
import {urlForImage} from '@/sanity/image'

interface SanityImageProps {
  value: {
    asset?: {_ref?: string; _type?: string} | null
    alt?: string | null
    hotspot?: {x?: number; y?: number} | null
    crop?: {top?: number; bottom?: number; left?: number; right?: number} | null
  }
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

export function SanityImage({
  value,
  width = 800,
  height = 800,
  className,
  sizes,
  priority,
}: SanityImageProps) {
  const url = urlForImage(value)?.width(width).height(height).url()
  if (!url) return null

  return (
    <Image
      src={url}
      alt={value.alt || ''}
      width={width}
      height={height}
      className={className}
      {...(sizes && {sizes})}
      {...(priority && {priority})}
    />
  )
}
