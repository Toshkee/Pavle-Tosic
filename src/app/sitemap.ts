import type { MetadataRoute } from "next";

// Single-page site — one entry, but its presence lets Google Search Console
// accept a sitemap submission and re-crawl faster after the redesign.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://pavletosic.com",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
