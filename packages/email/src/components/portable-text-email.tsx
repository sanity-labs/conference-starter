import {PortableText as PortableTextReact} from '@portabletext/react'
import type {PortableTextBlock} from '@portabletext/types'
import {Heading, Text, Link} from '@react-email/components'

/**
 * Portable Text serializer for React Email.
 * Accepts Array<Record<string, unknown>> for TypeGen compatibility
 * (TypeGen block type has optional `children` which conflicts with @portabletext/react).
 */

type PortableTextEmailValue = PortableTextBlock[] | Array<Record<string, unknown>>

export function PortableTextEmail({value}: {value: PortableTextEmailValue | null | undefined}) {
  if (!value || value.length === 0) return null
  return <PortableTextReact value={value as PortableTextBlock[]} components={emailComponents} />
}

const emailComponents = {
  block: {
    normal: ({children}: {children?: React.ReactNode}) => <Text style={textStyle}>{children}</Text>,
    h1: ({children}: {children?: React.ReactNode}) => (
      <Heading as="h1" style={h1Style}>
        {children}
      </Heading>
    ),
    h2: ({children}: {children?: React.ReactNode}) => (
      <Heading as="h2" style={h2Style}>
        {children}
      </Heading>
    ),
    h3: ({children}: {children?: React.ReactNode}) => (
      <Heading as="h3" style={h3Style}>
        {children}
      </Heading>
    ),
  },
  marks: {
    strong: ({children}: {children?: React.ReactNode}) => <strong>{children}</strong>,
    em: ({children}: {children?: React.ReactNode}) => <em>{children}</em>,
    link: ({value, children}: {value?: {href: string}; children?: React.ReactNode}) => (
      <Link href={value?.href || '#'} style={linkStyle}>
        {children}
      </Link>
    ),
  },
  list: {
    bullet: ({children}: {children?: React.ReactNode}) => <ul style={ulStyle}>{children}</ul>,
    number: ({children}: {children?: React.ReactNode}) => <ol style={olStyle}>{children}</ol>,
  },
  listItem: {
    bullet: ({children}: {children?: React.ReactNode}) => <li style={liStyle}>{children}</li>,
    number: ({children}: {children?: React.ReactNode}) => <li style={liStyle}>{children}</li>,
  },
}

const textStyle: React.CSSProperties = {
  color: '#27272a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const h1Style: React.CSSProperties = {
  color: '#18181b',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 16px',
}

const h2Style: React.CSSProperties = {
  color: '#18181b',
  fontSize: '20px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 12px',
}

const h3Style: React.CSSProperties = {
  color: '#18181b',
  fontSize: '17px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 12px',
}

const linkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const ulStyle: React.CSSProperties = {
  color: '#27272a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
  paddingLeft: '24px',
}

const olStyle: React.CSSProperties = {
  color: '#27272a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
  paddingLeft: '24px',
}

const liStyle: React.CSSProperties = {
  margin: '0 0 4px',
}
