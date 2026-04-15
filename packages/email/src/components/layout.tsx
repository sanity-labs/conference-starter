import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  conferenceName?: string;
  children: ReactNode;
}

export function EmailLayout({
  preview,
  conferenceName = "ContentOps Conf",
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>{conferenceName}</Text>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              {conferenceName} &middot; New York City
            </Text>
            <Text style={footerLinks}>
              <Link href="https://contentopsconf.dev" style={footerLink}>
                Website
              </Link>
              {" · "}
              <Link href="https://x.com/sanity_io" style={footerLink}>
                Twitter
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export interface CtaButtonProps {
  href: string;
  children: ReactNode;
}

export function CtaButton({ href, children }: CtaButtonProps) {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ margin: "24px 0" }}
    >
      <tbody>
        <tr>
          <td style={ctaButton}>
            <Link href={href} style={ctaLink}>
              {children}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0",
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px 32px",
};

const headerText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
  margin: "0",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  borderTop: "1px solid #e4e4e7",
  margin: "0",
};

const footer: React.CSSProperties = {
  padding: "24px 32px",
};

const footerText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "0 0 8px",
};

const footerLinks: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "0",
};

const footerLink: React.CSSProperties = {
  color: "#71717a",
  textDecoration: "underline",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
};

const ctaLink: React.CSSProperties = {
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};
