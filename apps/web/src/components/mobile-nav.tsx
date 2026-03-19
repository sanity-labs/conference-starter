'use client'

import {useState, useEffect, useRef, useCallback} from 'react'
import {usePathname} from 'next/navigation'

export function MobileNav({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Focus first link on open
  useEffect(() => {
    if (open) {
      const firstLink = navRef.current?.querySelector('a, button')
      if (firstLink instanceof HTMLElement) firstLink.focus()
    }
  }, [open])

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  return (
    <div className="sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-11 w-11 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-0.5 w-5 bg-text-primary transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`}
        />
        <span
          className={`block h-0.5 w-5 bg-text-primary transition-opacity ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`block h-0.5 w-5 bg-text-primary transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`}
        />
      </button>
      {open && (
        <div
          ref={navRef}
          className="absolute left-0 right-0 top-full border-b border-border bg-surface px-6 py-4"
        >
          {children}
        </div>
      )}
    </div>
  )
}
