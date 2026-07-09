import type { Metadata } from "next";
import NotFoundTerminal from "./NotFoundTerminal";

/* Themed 404 — the default Next.js not-found page is white and off-brand.
   Thin server shell for the metadata; the visual (which echoes the actual
   missed path via usePathname) lives in the client component. */

export const metadata: Metadata = {
  title: "404 — Pavle Tošić",
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundTerminal />;
}
