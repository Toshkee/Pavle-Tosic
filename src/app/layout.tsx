import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { EMAIL } from "./contact";

// Nippo (Fontshare, self-hosted under the ITF Free Font License, see
// fonts/NIPPO-LICENSE-FFL.txt): the display face for the wordmark, section
// heads and project titles. Two weights only. Body copy is the system stack,
// so this is the site's only webfont.
const nippo = localFont({
  src: [
    { path: "./fonts/nippo-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/nippo-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-nippo",
  display: "swap",
});

const DESCRIPTION =
  "Software developer at Infostream (Montenegro · Remote). TypeScript and React by choice, Oracle APEX and SQL on the job. I build web apps front to back.";

// Web analytics: Cloudflare Web Analytics is enabled on the zone (dashboard →
// Analytics & Logs → Web Analytics, site pavletosic.com) and injects its RUM
// beacon at the edge for real-browser requests. Do NOT also add the manual
// beacon <script> here: a second beacon would double-count every visit.

export const metadata: Metadata = {
  title: "Pavle Tošić, Software Developer",
  description: DESCRIPTION,
  metadataBase: new URL("https://pavletosic.com"),
  // The www host serves the same page (Cloudflare answers both), so without
  // this the two are duplicate content to a crawler.
  alternates: { canonical: "https://pavletosic.com" },
  openGraph: {
    title: "Pavle Tošić, Software Developer",
    description: DESCRIPTION,
    url: "https://pavletosic.com",
    siteName: "Pavle Tošić",
    images: [
      {
        // ?v=2 busts social scrapers' preview caches (WhatsApp/Telegram/X hold
        // og:images for weeks keyed by URL): bump it whenever og.png changes.
        url: "/og.png?v=5",
        width: 1200,
        height: 630,
        alt: "Pavle Tošić, Software Developer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pavle Tošić, Software Developer",
    description: DESCRIPTION,
    images: ["/og.png?v=5"],
  },
};

// Structured data so search engines tie the domain to the person and to the
// GitHub/LinkedIn profiles. Kept in sync by hand with the NAME/ROLE/SOCIAL
// constants in page.tsx: that file is "use client", so importing from it here
// would drag the whole page module into the server layout.
const PROFILE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    name: "Pavle Tošić",
    jobTitle: "Software Developer",
    url: "https://pavletosic.com",
    image: "https://pavletosic.com/og.png",
    email: `mailto:${EMAIL}`,
    address: { "@type": "PostalAddress", addressCountry: "ME" },
    worksFor: { "@type": "Organization", name: "Infostream" },
    knowsAbout: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Oracle APEX",
      "SQL",
    ],
    sameAs: [
      "https://github.com/Toshkee",
      "https://www.linkedin.com/in/tosiicp/",
    ],
  },
};

export const viewport: Viewport = {
  // width/initialScale are REQUIRED here: exporting a custom `viewport` makes
  // Next.js drop its default <meta name="viewport"> entirely, so without these
  // phones fall back to a ~980px layout and render the desktop layout shrunk.
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Font variables live on <html>: Tailwind v4 @theme tokens are substituted
  // at :root, so var(--font-nippo) must be defined there.
  return (
    <html
      lang="en"
      // globals.css sets `scroll-behavior: smooth` on <html>. Declaring it here
      // too tells Next the smooth scroll is deliberate, so route changes jump
      // to the top instantly instead of animating a long scroll (and landing
      // scroll restoration in the wrong place) on the way to a new page.
      data-scroll-behavior="smooth"
      className={nippo.variable}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PROFILE_JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}