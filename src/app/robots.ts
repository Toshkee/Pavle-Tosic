import type { MetadataRoute } from "next";

// Cloudflare merges its managed block (Content-Signal + the AI-crawler
// Disallow list) into whatever the origin serves, so this file only needs to
// supply the parts it doesn't: an explicit allow and the sitemap pointer that
// Search Console and Lighthouse look for. The landing Memoji's layers are
// kept out: the base frame has its irises painted out for the gaze, and
// Google picked it as the site's thumbnail, a Memoji with empty white eyes
// (seen 2026-11-17).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/images/memoji-still.webp",
          "/images/memoji-eye-",
          "/images/memoji-iris-",
        ],
      },
    ],
    sitemap: "https://pavletosic.com/sitemap.xml",
    host: "https://pavletosic.com",
  };
}
