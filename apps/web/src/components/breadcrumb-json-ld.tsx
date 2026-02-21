import {JsonLd} from '@/components/json-ld'
import type {BreadcrumbList} from 'schema-dts'
import {SITE_URL, SITE_NAME} from '@/lib/metadata'

interface BreadcrumbItem {
  name: string
  path: string
}

export function BreadcrumbJsonLd({items}: {items: BreadcrumbItem[]}) {
  return (
    <JsonLd<BreadcrumbList>
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: SITE_NAME,
            item: SITE_URL,
          },
          ...items.map((item, index) => ({
            '@type': 'ListItem' as const,
            position: index + 2,
            name: item.name,
            item: `${SITE_URL}${item.path}`,
          })),
        ],
      }}
    />
  )
}
