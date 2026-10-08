import { EDUCATION, EXPERIENCE, pointText, type LogEntry } from "../content";

/* "Where have you worked?": work and education as two timelines, as on the
   CV. */
export default function ExperienceCard() {
  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <Timeline heading="Work" entries={EXPERIENCE} />
      <Timeline heading="Education" entries={EDUCATION} className="mt-10" />
    </article>
  );
}

function Timeline({
  heading,
  entries,
  className = "",
}: {
  heading: string;
  entries: LogEntry[];
  className?: string;
}) {
  return (
    <section className={className}>
      <h3 className="text-xs font-semibold tracking-wider text-faint uppercase">
        {heading}
      </h3>
      <ol className="mt-4 space-y-7 border-l border-line pl-6">
        {entries.map((entry) => (
          <li key={entry.org} className="relative">
            <span
              aria-hidden
              className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-ink ring-4 ring-bg"
            />
            <p className="text-xs text-faint">{entry.period}</p>
            <h4 className="mt-0.5 font-semibold text-ink">
              {entry.role}, {entry.org}
            </h4>
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
    </section>
  );
}
