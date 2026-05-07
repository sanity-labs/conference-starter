'use client'

import {usePathname} from 'next/navigation'

export function MainChrome({children}: {children: React.ReactNode}) {
  const pathname = usePathname()
  if (pathname?.startsWith('/signage')) return null
  return <>{children}</>
}
