import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PROJECTS, thumbOf } from "../projects";

/* Index for the case studies. The home page shows these one at a time in the
   kiosk; this is the flat, linkable list a crawler and a recruiter both want. */

export const metadata: Metadata = {
  title: "Work — case studies | Pavle Tošić",
  description:
    "Case studies for the four projects: what the problem was, what I decided, what broke, and what shipped.",
  alternates: { canonical: "https://pavletosic.com/work" },
};

export default function WorkIndex() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <nav className="font-mono text-xs text-faint">
        <Link href="/" className="transition-colors hover:text-accent-ink">
          cd ~
        </Link>
        <span aria-hidden> / </span>
        <span className="text-muted">work</span>
      </nav>

      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Work
      </h1>
      <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.7] text-body">
        Four projects, each with a case study: the problem it set out to solve,
        the decisions behind it, what broke along the way, and what shipped.
      </p>

      <ul className="mt-10 space-y-4">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/work/${p.slug}`}
              className="group flex gap-5 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/60"
            >
              <Image
                src={thumbOf(p.shot)}
                alt=""
                width={160}
                height={90}
                className="hidden h-[90px] w-[160px] shrink-0 rounded-lg border border-line object-cover object-top sm:block"
              />
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                  {p.title}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-faint">
                  {p.role} · {p.context}
                </p>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-body">
                  {p.blurb}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 border-t border-line pt-6 font-mono text-xs text-faint">
        <Link href="/" className="transition-colors hover:text-accent-ink">
          ← back to pavletosic.com
        </Link>
      </p>
    </main>
  );
}
