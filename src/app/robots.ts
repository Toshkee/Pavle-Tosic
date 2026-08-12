import type { MetadataRoute } from "next";

// Cloudflare merges its managed block (Content-Signal + the AI-crawler
// Disallow list) into whatever the origin serves, so this file only needs to
// supply the parts it doesn't: an explicit allow and the sitemap pointer that
// Search Console and Lighthouse look for.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://pavletosic.com/sitemap.xml",
    host: "https://pavletosic.com",
  };
}
