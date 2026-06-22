import type { NextConfig } from "next"
import pkg from "./package.json"

const isDev = process.env.NODE_ENV !== "production"

// Content-Security-Policy. The app only loads same-origin resources; fonts are
// self-hosted by next/font and there are no external scripts/analytics. Inline
// scripts (theme/PWA bootstrap in layout) and the heavy inline styling need
// 'unsafe-inline'. 'unsafe-eval' is added only in dev (for HMR). A nonce-based
// CSP would be a stricter follow-up.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
]

// The install animation (public/instalare-pwa.html) is a self-contained bundle:
// it decodes its own assets to blob: URLs, loads scripts from those blobs, and
// runs a JSX runtime that needs eval. The strict app CSP would block all of
// that, so this one static file gets a relaxed policy — scoped to its path only.
// It also must be framable by our own pages (the install button embeds it), so
// X-Frame-Options is SAMEORIGIN here instead of DENY. Per Next's header rules,
// a later entry that sets the same key overrides the global one; keys it leaves
// alone (HSTS, nosniff, Referrer-Policy, Permissions-Policy) still apply.
const bundleCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: blob:",
  "connect-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ")

const bundleHeaders = [
  { key: "Content-Security-Policy", value: bundleCsp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
]

const nextConfig: NextConfig = {
  env: {
    // Exposed to the client — used in the account page version display.
    // Automatically updated by the GitHub Actions version-bump workflow.
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Override (must come after the global rule) for the install animation.
      { source: "/instalare-pwa.html", headers: bundleHeaders },
    ]
  },
}

export default nextConfig
