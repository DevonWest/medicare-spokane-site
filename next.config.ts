import type { NextConfig } from "next";

// Baseline security headers applied to every response. Kept conservative so
// they don't interfere with GTM, Google Tag Servers, or any analytics scripts
// loaded by GTM at runtime — those are gated by the site administrator inside
// GTM itself.
const securityHeaders = [
  // 1 year HSTS, include subdomains, eligible for preload list.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Block MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin on cross-origin navigation; no PII in the URL leaks.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We never embed the site in a frame.
  { key: "X-Frame-Options", value: "DENY" },
  // Drop powerful APIs we never use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Modern X-Frame replacement.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
