'use client'

import {useEffect, useState} from 'react'

type Theme = 'system' | 'light' | 'dark'
const STORAGE_KEY = 'theme'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
    setTheme(stored)

    if (stored !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  function pick(next: Theme) {
    setTheme(next)
    if (next === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, next)
    }
    applyTheme(next)
  }

  return (
    <fieldset className="inline-flex items-center gap-0 rounded-md border border-border p-0.5 text-sm">
      <legend className="sr-only">Theme</legend>
      {(['system', 'light', 'dark'] as const).map((t) => (
        <label
          key={t}
          className={`cursor-pointer rounded px-2 py-1 ${
            theme === t ? 'bg-surface-muted text-text-primary' : 'text-text-muted'
          }`}
        >
          <input
            type="radio"
            name="theme"
            value={t}
            checked={theme === t}
            onChange={() => pick(t)}
            className="sr-only"
          />
          {t[0].toUpperCase() + t.slice(1)}
        </label>
      ))}
    </fieldset>
  )
}
