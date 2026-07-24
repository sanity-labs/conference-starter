import {useMemo, useSyncExternalStore} from 'react'

/** True when the viewport is narrower than `breakpoint` px (drawer-mode layout) */
export function useIsNarrow(breakpoint = 720): boolean {
  const query = useMemo(
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`),
    [breakpoint],
  )
  return useSyncExternalStore(
    (onChange) => {
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => query.matches,
  )
}
