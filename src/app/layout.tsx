import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Mononoki — self-hosted monospace used across the whole site.
const mononoki = localFont({
  src: [
    { path: "./fonts/mononoki-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/mononoki-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/mononoki-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/mononoki-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-mononoki",
  display: "swap",
});

const DESCRIPTION =
  "Software developer at Infostream (Montenegro · Remote) — Oracle APEX, .NET, C#, JavaScript/TypeScript and React. I build web apps front to back.";

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
        url: "/images/me.jpg",
        alt: "Pavle Tošić",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pavle Tošić — Software Developer",
    description: DESCRIPTION,
    images: ["/images/me.jpg"],
  },
};

export const viewport: Viewport = {
  // width/initialScale are REQUIRED here: exporting a custom `viewport` makes
  // Next.js drop its default <meta name="viewport"> entirely, so without these
  // phones fall back to a ~980px layout and render the desktop layout shrunk.
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ecdf",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${mononoki.variable} antialiased`}>
        {/* Progressive enhancement: scroll-reveal animations ship with
            opacity:0 / transforms inline. If JS never runs, force everything
            visible so the page is never blank. Only applies with JS disabled. */}
        <noscript>
          <style>{`
            [style*="opacity:0"], [style*="opacity: 0"] { opacity: 1 !important; }
            [style*="translateY"], [style*="translateX"] { transform: none !important; }
            [style*="blur"] { filter: none !important; }
          `}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}