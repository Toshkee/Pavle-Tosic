"use client";

import { Icon } from "@iconify/react";
import { Section } from "./Section";
import { MARKS, STACK_LINE } from "./content";

/* The stack as a marquee, after 21st.dev/@grootstudio/components/logo-marquee:
   an infinite row with mask-faded edges that slows to a crawl on hover.
   Two rows, opposite directions. Pure CSS animation on transform, so it
   costs nothing on the main thread; static under reduced motion. */
const ROW_A = MARKS.slice(0, Math.ceil(MARKS.length / 2));
const ROW_B = MARKS.slice(Math.ceil(MARKS.length / 2));

export default function Inside() {
  return (
    <Section id="inside" label="Stack" className="!px-0 !py-[8svh] md:!py-[10svh]">
      <Row items={ROW_A} />
      <Row items={ROW_B} reverse />
      <p className="mx-auto mt-10 max-w-[1440px] px-6 text-[15px] leading-relaxed text-ink/80 md:px-[6vw] md:text-[16px]">
        <span className="block max-w-[56ch]">{STACK_LINE}</span>
      </p>
    </Section>
  );
}

function Row({ items, reverse = false }: { items: typeof MARKS; reverse?: boolean }) {
  const track = [...items, ...items]; // duplicated so -50% loops seamlessly
  return (
    <div className={`marquee ${reverse ? "marquee--reverse" : ""} mb-4`} aria-label="Tools">
      <ul className="marquee__track">
        {track.map((m, i) => (
          <li key={`${m.name}-${i}`} aria-hidden={i >= items.length} className="glass glass-pill flex items-center gap-3 px-5 py-2.5 text-[14px] text-ink/85">
            <Icon icon={m.icon} width={20} height={20} aria-hidden />
            <span>{m.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
