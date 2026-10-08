import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EMAIL } from "./contact";
import FluidCursor from "./site/FluidCursor";

// Runs before first paint, so a visitor who picked dark with the toggle
// never sees a flash of the light page. Without a stored choice the page is
// light. Inline on purpose: CSP allows inline scripts (next.config.ts) and
// an external file would arrive after the paint.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

const DESCRIPTION =
  "Software developer at Infostream, Montenegro. TypeScript and React by choice, Oracle APEX, Oracle Database and .NET with C# at work. I build web apps front to back.";

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
        url: "/og.png?v=7",
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
    images: ["/og.png?v=7"],
  },
};

// Structured data so search engines tie the domain to the person and to the
// GitHub/LinkedIn profiles. Kept in sync by hand with NAME/ROLE/SOCIAL in
// site/content.ts.
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
      "Oracle Database",
      ".NET",
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
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The theme script writes data-theme before React hydrates, so the
    // attribute legitimately differs from the server HTML.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PROFILE_JSON_LD) }}
        />
        <FluidCursor />
        {children}
      </body>
    </html>
  );
}