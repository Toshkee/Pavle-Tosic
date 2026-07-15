import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConsoleSignature from "./ConsoleSignature";
import AnimatedFavicon from "./AnimatedFavicon";

// Mononoki — self-hosted monospace used across the whole site.
const mononoki = localFont({
  // 700-italic is intentionally omitted — no bold+italic text exists on the
  // site, so shipping/preloading that face was pure dead weight.
  src: [
    { path: "./fonts/mononoki-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/mononoki-400-italic.woff2", weight: "400", style: "italic" },
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
  openGraph: {
    title: "Pavle Tošić — Software Developer",
    description: DESCRIPTION,
    url: "https://pavletosic.com",
    siteName: "Pavle Tošić",
    images: [
      {
        // ?v=2 busts social scrapers' preview caches (WhatsApp/Telegram/X hold
        // og:images for weeks keyed by URL) — bump it whenever og.png changes.
        url: "/og.png?v=2",
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
    images: ["/og.png?v=2"],
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
      suppressHydrationWarning
      className={`${mononoki.variable} ${tanker.variable}`}
    >
      <body className="antialiased">
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