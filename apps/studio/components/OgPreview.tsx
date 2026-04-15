import { useEffect, useState, useRef } from "react";
import type { SanityDocument } from "sanity";

const PREVIEW_URL =
  process.env.SANITY_STUDIO_PREVIEW_URL || "http://localhost:3000";

interface OgPreviewProps {
  document: {
    displayed: SanityDocument;
  };
  options: {
    type: "session" | "speaker" | "page" | "conference";
  };
}

function getSlug(doc: SanityDocument): string | null {
  const slug = doc?.slug as { current?: string } | undefined;
  return slug?.current ?? null;
}

function buildOgUrl(doc: SanityDocument, type: string): string | null {
  if (type === "conference") {
    return `${PREVIEW_URL}/api/og`;
  }

  const slug = getSlug(doc);
  if (!slug) return null;

  if (type === "session") {
    return `${PREVIEW_URL}/api/og?type=session&slug=${encodeURIComponent(slug)}`;
  }
  if (type === "speaker") {
    return `${PREVIEW_URL}/api/og?type=speaker&slug=${encodeURIComponent(slug)}`;
  }

  // page and other types — use default card
  return `${PREVIEW_URL}/api/og`;
}

export function OgPreview({
  document: { displayed },
  options,
}: OgPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const ogUrl = displayed ? buildOgUrl(displayed, options.type) : null;

  // Debounce refresh when document changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setRefreshKey((k) => k + 1);
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    displayed?.title,
    displayed?.name,
    displayed?.seoTitle,
    displayed?.seoDescription,
    // Stringify slug to trigger on change
    JSON.stringify(displayed?.slug),
  ]);

  // Fetch the image
  useEffect(() => {
    if (!ogUrl) {
      setImageUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const separator = ogUrl.includes("?") ? "&" : "?";
    fetch(`${ogUrl}${separator}_t=${refreshKey}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load preview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ogUrl, refreshKey]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, []);

  const title =
    (displayed?.seoTitle as string) ||
    (displayed?.title as string) ||
    (displayed?.name as string) ||
    "";
  const description = (displayed?.seoDescription as string) || "";
  const slug = getSlug(displayed);

  return (
    <div style={{ padding: "24px", maxWidth: "720px" }}>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "16px",
          color: "#27272a",
        }}
      >
        Social Share Preview
      </h2>

      {!slug && options.type !== "conference" && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fefce8",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#854d0e",
            marginBottom: "16px",
          }}
        >
          Add a slug to see the OG image preview.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#dc2626",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* OG Image */}
      <div
        style={{
          border: "1px solid #e4e4e7",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#f4f4f5",
          opacity: loading ? 0.6 : 1,
          transition: "opacity 150ms ease",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="OG preview"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              aspectRatio: "1200 / 630",
            }}
          />
        ) : (
          <div
            style={{
              aspectRatio: "1200 / 630",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
              fontSize: "14px",
            }}
          >
            {loading ? "Loading preview…" : "No preview available"}
          </div>
        )}

        {/* Metadata preview (mimics social card text) */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e4e4e7" }}>
          <p style={{ fontSize: "12px", color: "#a1a1aa", margin: 0 }}>
            contentops-conf.sanity.dev
          </p>
          {title && (
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#27272a",
                margin: "4px 0 0",
              }}
            >
              {title}
            </p>
          )}
          {description && (
            <p
              style={{
                fontSize: "13px",
                color: "#71717a",
                margin: "2px 0 0",
                lineHeight: 1.4,
              }}
            >
              {description.length > 160
                ? `${description.slice(0, 157)}…`
                : description}
            </p>
          )}
        </div>
      </div>

      {/* Character counts */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "24px",
          fontSize: "12px",
          color: "#a1a1aa",
        }}
      >
        <span>
          Title: {title.length}/60
          {title.length > 60 && (
            <span style={{ color: "#f59e0b" }}> (may be truncated)</span>
          )}
        </span>
        <span>
          Description: {description.length}/160
          {description.length > 160 && (
            <span style={{ color: "#f59e0b" }}> (may be truncated)</span>
          )}
        </span>
      </div>
    </div>
  );
}
