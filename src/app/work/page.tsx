import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PROJECTS, thumbOf } from "../projects";

/* Index for the case studies: the flat, linkable list a crawler and a
   recruiter both want. Same ruled-index treatment as the client work on the
   front page. */

export const metadata: Metadata = {
  title: "Work — case studies | Pavle Tošić",
  description:
    "Case studies for seven projects: what the problem was, what I decided, what broke, and what shipped.",
  alternates: { canonical: "https://pavletosic.com/work" },
};

export default function WorkIndex() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <nav className="text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Pavle Tošić
        </Link>
        <span aria-hidden> / </span>
        <span className="text-muted">Work</span>
      </nav>

      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Work
      </h1>
      <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.7] text-body">
        Seven projects, each with a case study: the problem it set out to solve,
        the decisions behind it, what broke along the way, and what shipped.
      </p>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/work/${p.slug}`}
              className="flex gap-6 py-6 text-body transition-colors hover:text-ink"
            >
              <Image
                src={thumbOf(p.shot)}
                alt=""
                width={160}
                height={100}
                className="plate hidden h-[100px] w-[160px] shrink-0 rounded-[6px] object-cover object-top sm:block"
              />
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight text-ink">
                  {p.title}
                </h2>
                <p className="mt-1 text-[13px] text-faint">
                  {p.role}, {p.context}
                </p>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-body">
                  {p.blurb}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 border-t border-line pt-6 text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Back to the front page
        </Link>
      </p>
    </main>
  );
}
