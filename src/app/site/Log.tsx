import { Section, Heading } from "./Section";
import { LOG } from "./content";

/* Release history. Scoped the way it happened: a contribution is called a
   contribution, a prototype is called a prototype. */
export default function Log() {
  return (
    <Section id="log" label="Experience">
      <Heading>Log</Heading>
      <ol className="glass glass-panel glass-dark divide-y divide-line px-6 md:px-10 lg:px-12">
        {LOG.map((e) => (
          <li
            key={e.org}
            className="grid gap-4 py-8 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-10 md:py-10"
          >
            <div className="text-[13px] text-faint md:pt-1.5">{e.period}</div>
            <div>
              <h3 className="font-display text-[22px] font-medium leading-tight text-ink md:text-[26px]">
                {e.org}
                <span className="text-body"> / {e.role}</span>
              </h3>
              <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink/80">
                {e.scope}
              </p>
              {e.points.length > 0 && (
                <ul className="mt-5 max-w-[62ch] space-y-3 text-[14px] leading-relaxed text-ink/80">
                  {e.points.map((pt) => (
                    <li key={pt} className="grid grid-cols-[1rem_1fr] gap-2">
                      <span aria-hidden className="pt-[0.62em] text-faint">
                        <span className="block h-px w-2.5 bg-current" />
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
              {e.link && (
                <p className="mt-4 text-[13px]">
                  <a
                    href={e.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline text-body hover:text-ink"
                  >
                    {e.link.label}
                  </a>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
