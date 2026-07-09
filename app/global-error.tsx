"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fafafa",
            color: "#18181b",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#a1a1aa",
              marginBottom: "1rem",
            }}
          >
            Niena
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#71717a", maxWidth: "28rem", marginBottom: "1.5rem" }}>
            An unexpected error occurred. Our team has been notified automatically.
            {error.digest && (
              <>
                <br />
                <span style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                  Error ID: {error.digest}
                </span>
              </>
            )}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "#18181b",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/dashboard"
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid #e4e4e7",
                background: "#ffffff",
                color: "#18181b",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
