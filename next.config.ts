import type { NextConfig } from "next";

// Enforced allowlist for every browser-controlled resource type. Next's static
// bootstrap currently requires inline scripts, but inline event-handler
// attributes remain blocked and third-party script origins stay tightly pinned.
const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is unavoidable here: every page is statically prerendered,
  // and Next inlines its own bootstrap + RSC payload scripts whose content
  // changes each build. Hashing them isn't maintainable, and a nonce would
  // force dynamic rendering and give up the static edge cache. The policy
  // still pins every EXTERNAL script origin, which is what stops an injected
  // third-party script from loading.
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  // Tailwind v4 and Framer Motion both write inline styles.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  // Binance market stream + REST fallback (LiveTicker), the contributions API
  // (GitHubGraph), and the analytics beacon's own reporting endpoint.
  "connect-src 'self' wss://stream.binance.com:9443 https://api.binance.com https://data-api.binance.vision https://github-contributions-api.jogruber.de https://cloudflareinsights.com",
  "script-src-attr 'none'",
  "worker-src 'none'",
  "frame-src 'none'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Turbopack's development client needs eval/WebSocket capabilities that the
// production policy intentionally denies. Keep development report-only while
// enforcing the exact same policy in builds and deployments.
const CSP_HEADER =
  process.env.NODE_ENV === "development"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), usb=()",
  },
  // frame-ancestors above covers modern browsers; this is the legacy twin.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: CSP_HEADER, value: CSP },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    // On Cloudflare Workers (via @opennextjs/cloudflare) there is no IMAGES
    // binding, so the /_next/image endpoint returns the original bytes anyway —
    // it just adds a Worker hop and skips the immutable static-asset cache.
    // Serving images directly (unoptimized) removes that hop and lets them be
    // edge-cached. The only <Image> use that renders is the small avatar, so
    // there is no quality trade-off here.
    unoptimized: true,
  },
};

export default nextConfig;
