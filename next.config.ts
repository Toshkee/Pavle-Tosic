import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
