"use client";

// Route-level error boundary. Renders inside the root layout, so the Header
// and Footer remain visible. See app/global-error.tsx for the layout-level
// fallback.
//
// `unstable_retry` is Next.js 16's renamed `reset` callback — the underscore
// prefix reflects upstream's unstable contract, but it is the documented public
// API for this version.

import Link from "next/link";
import { useEffect } from "react";
import { siteConfig } from "@/lib/site";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log to the server console (visible in Cloud Run logs via the browser
    // network tab is not enough) — kept minimal to avoid leaking PII.
    console.error("[app/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-5xl font-extrabold text-blue-700 mb-4">Something went wrong</h1>
      <p className="text-gray-700 mb-2 max-w-md">
        We hit an unexpected error displaying this page. Please try again, or call us for immediate Medicare help.
      </p>
      {error.digest ? (
        <p className="text-xs text-gray-400 mb-6">Reference: {error.digest}</p>
      ) : (
        <div className="mb-6" />
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Return Home
        </Link>
        <a
          href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
          className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Call {siteConfig.phone}
        </a>
      </div>
    </div>
  );
}
