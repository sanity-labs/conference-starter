import Link from 'next/link'

interface BreadcrumbItem {
  name: string
  path: string
}

export function Breadcrumbs({items}: {items: BreadcrumbItem[]}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-text-primary">
            Home
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {isLast ? (
                <span aria-current="page" className="text-text-secondary">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-text-primary">
                  {item.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
