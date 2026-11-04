import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS, thumbOf } from "../projects";
import Crumbs from "../site/Crumbs";
import ProjectIndex from "../site/ProjectIndex";

/* Index for the case studies: the flat, linkable list a crawler and a
   recruiter both want, with a way into the chat for anyone who would
   rather ask. */

export const metadata: Metadata = {
  title: "Work — case studies | Pavle Tošić",
  // The count comes from PROJECTS: written out, it said "nine" after the
  // tenth was added.
  description: `Case studies for ${PROJECTS.length} projects: what the problem was, what I decided, what broke, and what shipped.`,
  alternates: { canonical: "https://pavletosic.com/work" },
};

export default function WorkIndex() {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-6 sm:px-8 sm:py-14">
      <div className="glass rounded-3xl px-5 py-8 sm:px-10 sm:py-12">
        <Crumbs trail={[{ label: "Work" }]} />

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Work
        </h1>
        <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.7] text-body">
          {PROJECTS.length} projects, each with a case study: the problem it set out to solve,
          the decisions behind it, what broke along the way, and what shipped.
          Or{" "}
          <Link
            href={{
              pathname: "/chat",
              query: { q: "What are your projects? What have you built recently?" },
            }}
            className="link-underline text-ink"
          >
            ask me about them
          </Link>
          .
        </p>

        <ProjectIndex
          rows={PROJECTS.map((p) => ({
            slug: p.slug,
            title: p.title,
            tag: `${p.role}, ${p.context}`,
            thumb: thumbOf(p.shot),
          }))}
        />

        <p className="mt-12 border-t border-line pt-6 text-[13px] text-faint">
          <Link href="/" className="transition-colors hover:text-ink">
            Back to the front page
          </Link>
        </p>
      </div>
    </main>
  );
}
