import type { MetadataRoute } from "next";
import { PROJECTS } from "./projects";

const SITE = "https://pavletosic.com";

// The home page is the product; the case studies under /work are the pages a
// crawler can actually land on per project (the home deck is one client-side
// route). Generated from PROJECTS so a new project can't be forgotten here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/work`, changeFrequency: "monthly", priority: 0.8 },
    ...PROJECTS.map((p) => ({
      url: `${SITE}/work/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
