import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "./site/ThemeToggle";

export const metadata: Metadata = {
  title: "Not found | Pavle Tošić",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100svh] flex-col justify-end px-6 pb-[12svh] md:px-[6vw]">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="glass max-w-xl rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
        <p className="mb-3 font-display text-[13px] font-medium uppercase tracking-[0.32em] text-body">
          404
        </p>
        <h1 className="font-display text-[clamp(2.6rem,9vw,7rem)] leading-none font-bold tracking-tight text-ink">
          Not here.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[15px] text-body">
          That page does not exist on this site. Ask me anything on the front
          page, or read the case studies.
        </p>
        {/* Wraps as whole links: on a phone, three in a row broke each one
            over two lines. */}
        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[15px] whitespace-nowrap">
          <Link href="/" className="link-underline text-ink">
            Front page
          </Link>
          <Link href="/work" className="link-underline text-ink">
            Case studies
          </Link>
          <Link href="/play" className="link-underline text-ink">
            Or play a game
          </Link>
        </p>
      </div>
    </main>
  );
}
