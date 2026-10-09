import type { MetadataRoute } from "next";
import { PROJECTS } from "./projects";

const SITE = "https://pavletosic.com";

// The front page is the chat's door and says little; /about is the CV as a
// page, and the case studies under /work are the page a crawler can land on
// per project. Generated from PROJECTS so a new project can't be forgotten
// here. /chat is noindex, so it is not listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/work`, changeFrequency: "monthly", priority: 0.8 },
    ...PROJECTS.map((p) => ({
      url: `${SITE}/work/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
