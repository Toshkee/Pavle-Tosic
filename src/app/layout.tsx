import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConsoleSignature from "./ConsoleSignature";
import AnimatedFavicon from "./AnimatedFavicon";
import { EMAIL } from "./contact";

// Mononoki — self-hosted monospace used across the whole site.
const mononoki = localFont({
  // Only the two faces that carry real text. 700-italic never existed on the
  // site, and 400-italic earned its 35KB back: every face declared here is
  // preloaded, and italic is used for exactly two things (terminal comment
  // lines, code-tab comments) where the browser's synthesised oblique of the
  // regular face is indistinguishable at mono sizes.
  src: [
    { path: "./fonts/mononoki-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/mononoki-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mononoki",
  display: "swap",
});

// Tanker (Fontshare, self-hosted under the ITF Free Font License — see
// fonts/TANKER-LICENSE-FFL.txt) — display face for headlines only (name,
// section headings, project titles). Single heavy weight, caps-forward:
// stencil/poster energy against the terminal mono. Mono stays everywhere
// else. Glyph coverage verified for the site title "Pavle Tošić" (š/ć).
const tanker = localFont({
  src: [{ path: "./fonts/tanker-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-tanker",
  display: "swap",
});

const DESCRIPTION =
  "Software developer at Infostream (Montenegro · Remote). TypeScript and React by choice, Oracle APEX and SQL on the job. I build web apps front to back.";

// Web analytics: Cloudflare Web Analytics is enabled on the zone (dashboard →
// Analytics & Logs → Web Analytics, site pavletosic.com) and injects its RUM
// beacon at the edge for real-browser requests. Do NOT also add the manual
// beacon <script> here — a second beacon would double-count every visit.

export const metadata: Metadata = {
  title: "Pavle Tošić — Software Developer",
  description: DESCRIPTION,
  metadataBase: new URL("https://pavletosic.com"),
  // The www host serves the same page (Cloudflare answers both), so without
  // this the two are duplicate content to a crawler.
  alternates: { canonical: "https://pavletosic.com" },
  openGraph: {
    title: "Pavle Tošić — Software Developer",
    description: DESCRIPTION,
    url: "https://pavletosic.com",
    siteName: "Pavle Tošić",
    images: [
      {
        // ?v=2 busts social scrapers' preview caches (WhatsApp/Telegram/X hold
        // og:images for weeks keyed by URL) — bump it whenever og.png changes.
        url: "/og.png?v=3",
        width: 1200,
        height: 630,
        alt: "Pavle Tošić — Software Developer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pavle Tošić — Software Developer",
    description: DESCRIPTION,
    images: ["/og.png?v=3"],
  },
};

// Structured data so search engines tie the domain to the person and to the
// GitHub/LinkedIn profiles. Kept in sync by hand with the NAME/ROLE/SOCIAL
// constants in page.tsx — that file is "use client", so importing from it here
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
  themeColor: "#0a0f0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning: the inline script below sets `pt-skip-boot` on
  // <html> before hydration, so the class intentionally differs from the
  // server HTML. This suppresses the warning for <html>'s attributes only.
  // Font variables live on <html>, not <body>: Tailwind v4 @theme tokens
  // (--font-display etc.) are substituted at :root, so var(--font-tanker)
  // must be defined there — on <body> it silently fails and font-display
  // falls back to the inherited mono.
  return (
    <html
      lang="en"
      // globals.css sets `scroll-behavior: smooth` on <html>. Declaring it here
      // too tells Next the smooth scroll is deliberate, so route changes jump
      // to the top instantly instead of animating a long scroll (and landing
      // scroll restoration in the wrong place) on the way to a new page.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${mononoki.variable} ${tanker.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PROFILE_JSON_LD) }}
        />
        {/* Render-blocking, runs before the boot overlay paints: returning-
            session visitors (sessionStorage) and reduced-motion users skip the
            intro with no flash. The class hides .boot-overlay via CSS; the
            React component then unmounts it (already invisible). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('pt_booted')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('pt-skip-boot')}}catch(e){}",
          }}
        />
        {/* Progressive enhancement: scroll-reveal animations ship with
            opacity:0 / transforms inline. If JS never runs, force everything
            visible so the page is never blank. Only applies with JS disabled. */}
        <noscript>
          <style>{`
            [style*="opacity:0"], [style*="opacity: 0"] { opacity: 1 !important; }
            [style*="translateY"], [style*="translateX"] { transform: none !important; }
            [style*="blur"] { filter: none !important; }
            /* JS can't dismiss the boot overlay, so never show it without JS. */
            .boot-overlay { display: none !important; }
          `}</style>
        </noscript>
        <ConsoleSignature />
        <AnimatedFavicon />
        {children}
      </body>
    </html>
  );
}