import { EDUCATION, EXPERIENCE, pointText, type LogEntry } from "../content";

/* "Where have you worked?": work and education as two timelines, as on the
   CV. The /about page shows the same timelines under its own headings. */
export default function ExperienceCard() {
  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <section>
        <h3 className="text-xs font-semibold tracking-wider text-faint uppercase">
          Work
        </h3>
        <Timeline entries={EXPERIENCE} />
      </section>
      <section className="mt-10">
        <h3 className="text-xs font-semibold tracking-wider text-faint uppercase">
          Education
        </h3>
        <Timeline entries={EDUCATION} />
      </section>
    </article>
  );
}

export function Timeline({ entries }: { entries: LogEntry[] }) {
  return (
    <ol className="mt-4 space-y-7 border-l border-line pl-6">
      {entries.map((entry) => (
        <li key={entry.org} className="relative">
          <span
            aria-hidden
            className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-ink ring-4 ring-bg"
          />
          <p className="text-xs text-faint">{entry.period}</p>
          {/* A bold line, not a heading: the list sits under an h3 on the
              card and an h2 on /about, and a heading here would skip a
              level on one of them. */}
          <p className="mt-0.5 font-semibold text-ink">
            {entry.role}, {entry.org}
          </p>
          {entry.scope && (
            <p className="mt-1 text-sm leading-relaxed text-body">
              {entry.scope}
            </p>
          )}
          {entry.points.length > 0 && (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-body">
              {entry.points.map((point) => (
                <li key={pointText(point)}>
                  {pointText(point)}
                  {typeof point !== "string" && (
                    <>
                      {" "}
                      <a
                        href={point.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline text-ink"
                      >
                        {point.label}
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {entry.link && (
            <a
              href={entry.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-2 inline-block text-sm text-ink"
            >
              {entry.link.label}
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}
