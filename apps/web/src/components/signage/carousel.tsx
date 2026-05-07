'use client'

import {useEffect, useState} from 'react'

type CarouselProps = {
  items: React.ReactNode[]
  dwellSeconds?: number
  transition?: 'fade' | 'slide' | 'none'
  startAt?: number
}

export function Carousel({
  items,
  dwellSeconds = 8,
  transition = 'fade',
  startAt = 0,
}: CarouselProps) {
  const [index, setIndex] = useState(startAt)

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, Math.max(2, dwellSeconds) * 1000)
    return () => clearInterval(id)
  }, [items.length, dwellSeconds])

  if (items.length === 0) return null
  if (items.length === 1) return <>{items[0]}</>

  return (
    <div className="carousel-root" data-transition={transition}>
      {items.map((item, i) => (
        <div
          key={i}
          className="carousel-frame"
          data-state={i === index ? 'active' : 'hidden'}
          aria-hidden={i !== index}
        >
          {item}
        </div>
      ))}
      <CarouselProgress index={index} total={items.length} dwellSeconds={dwellSeconds} />
    </div>
  )
}

function CarouselProgress({
  index,
  total,
  dwellSeconds,
}: {
  index: number
  total: number
  dwellSeconds: number
}) {
  return (
    <div className="carousel-progress" aria-hidden>
      <div className="carousel-progress-track">
        {Array.from({length: total}).map((_, i) => (
          <div
            key={i}
            className="carousel-progress-segment"
            data-state={i < index ? 'past' : i === index ? 'active' : 'future'}
            style={
              i === index
                ? ({['--dwell' as string]: `${Math.max(2, dwellSeconds)}s`} as React.CSSProperties)
                : undefined
            }
          >
            <div className="carousel-progress-fill" key={`fill-${index}-${i}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
