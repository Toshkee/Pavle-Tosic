import { Section, Heading } from "./Section";
import { ABOUT_HEADING, ABOUT, SPEC } from "./content";
import Island from "./Island";
import VoxelMe from "./VoxelMe";

/* About, on one dark-tinted glass panel so the text reads over any photo.
   The statement is the section heading; the portrait runs the panel's full
   height, flush to its left edge (the panel's `contain: paint` does the
   rounding), with the copy and the checkable facts beside it. */
export default function Spec() {
  return (
    <Section id="about" label="About">
      <Heading kicker="About" index={1} island={
          <Island name="cabin">
            <span className="island__me">
              <VoxelMe />
            </span>
          </Island>
        }>
        {ABOUT_HEADING}
      </Heading>
      <div className="glass glass-blur glass-panel glass-dark-deep grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <div className="relative aspect-[4/5] md:aspect-auto">
          <img
            src="/images/hero/portrait.webp"
            alt="Pavle Tošić"
            width={720}
            height={882}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
          />
          {/* melts the photo's right edge into the panel on desktop, its bottom on phones */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgb(20_20_24/0.9)] via-transparent to-transparent md:bg-gradient-to-l" />
        </div>
        <div className="p-6 md:p-10 lg:p-14">
          <div className="max-w-[58ch] space-y-4 text-[15px] leading-relaxed text-ink/85 md:text-[17px]">
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
