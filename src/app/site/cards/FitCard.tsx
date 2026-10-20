import Link from "next/link";
import { LuCheck, LuMinus, LuX } from "react-icons/lu";
import type { FitRow } from "../../chat-protocol";
import { projectBySlug } from "../../projects";

/* "Do I fit this job?": the visitor's ad, one requirement per row, each
   marked from the facts the prompt holds, with the project that backs it
   linked to its case study. The one card written by the model rather than
   rendered from a data file, so it says so at the bottom. No score: a
   recruiter reads the rows, not a percentage. Status is in ink weight and
   a word, not colour, so the blue send button stays the page's one colour. */

const MATCH = {
  yes: { label: "Yes", Icon: LuCheck, className: "bg-ink text-bg" },
  partly: { label: "Partly", Icon: LuMinus, className: "border border-line-strong text-ink" },
  no: { label: "Not yet", Icon: LuX, className: "border border-line text-faint" },
} satisfies Record<FitRow["match"], unknown>;

export default function FitCard({
  role,
  rows,
}: {
  role: string | null;
  rows: FitRow[];
}) {
  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <h3 className="text-xs font-semibold tracking-wider text-faint uppercase">
        How I match{role ? `: ${role}` : " this role"}
      </h3>
      <ul className="mt-4 divide-y divide-line">
        {rows.map((row) => {
          const { label, Icon, className } = MATCH[row.match];
          const project = row.slug ? projectBySlug(row.slug) : undefined;
          return (
            <li key={row.requirement} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span
                className={`mt-0.5 flex h-6 w-[76px] shrink-0 items-center justify-center gap-1 rounded-full text-xs font-medium ${className}`}
              >
                <Icon aria-hidden className="size-3.5" />
                {label}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{row.requirement}</p>
                <p className="mt-1 text-sm leading-relaxed text-body">
                  {row.evidence}
                  {project && (
                    <>
                      {" "}
                      <Link href={`/work/${project.slug}`} className="link-underline text-ink">
                        {project.title} case study
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-faint">
        Matched by the AI against my CV and projects. The case studies have
        the details.
      </p>
    </article>
  );
}
