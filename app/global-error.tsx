"use client";

// Root-layout-level error boundary. Used when the root layout itself fails.
// Must define its own <html> and <body> tags.

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          padding: "4rem 1rem",
          background: "#fff",
          color: "#111827",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#1d4ed8", marginBottom: "0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: 480, margin: "0 auto 1rem" }}>
          We hit an unexpected error. Please try again or return home.
        </p>
        {error.digest ? (
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1.5rem" }}>
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            background: "#1d4ed8",
            color: "#fff",
            fontWeight: 600,
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
