import { Section, Heading } from "./Section";
import { ABOUT_HEADING, ABOUT, SPEC } from "./content";

/* About, on one dark-tinted glass panel so the text reads over any photo:
   the portrait framed on the left, the live site's copy and the checkable
   facts on the right. */
export default function Spec() {
  return (
    <Section id="about" label="About">
      <Heading>About</Heading>
      <div className="glass glass-blur glass-panel glass-dark-deep grid gap-8 p-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12 md:p-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:p-12">
        <div>
          <img
            src="/images/hero/portrait.webp"
            alt="Pavle Tošić"
            width={720}
            height={882}
            loading="lazy"
            className="mx-auto w-[200px] rounded-[20px] md:w-full"
          />
        </div>
        <div>
          <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] font-bold leading-[1.1] text-ink">
            {ABOUT_HEADING}
          </h3>
          <div className="mt-5 max-w-[58ch] space-y-4 text-[15px] leading-relaxed text-ink/85 md:text-[16px]">
            {ABOUT.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="mt-8 divide-y divide-line border-t border-line">
            {SPEC.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[8.5rem_1fr] gap-4 py-3 text-[14px] md:grid-cols-[10rem_1fr] md:text-[15px]"
              >
                <dt className="text-muted">{row.label}</dt>
                <dd className="text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
