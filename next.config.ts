import type { NextConfig } from "next";

// Report-Only for now: the policy is reported to the console but nothing is
// blocked, so a missed source can't break the page. Switch the header name to
// Content-Security-Policy once a few days of real traffic report clean.
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
  // (GitHubGraph), the CryptoFlow backend warm-up ping (COLD_APIS in page.tsx),
  // and the analytics beacon's own reporting endpoint.
  "connect-src 'self' wss://stream.binance.com:9443 https://api.binance.com https://data-api.binance.vision https://github-contributions-api.jogruber.de https://cryptoflow-api-cx07.onrender.com https://cloudflareinsights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // frame-ancestors above covers modern browsers; this is the legacy twin.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
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
