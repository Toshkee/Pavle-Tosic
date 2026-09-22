"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Section, Heading } from "./Section";
import { LOG } from "./content";
import Island from "./Island";

/* Release history. Scoped the way it happened: a contribution is called a
   contribution, a prototype is called a prototype.

   The left edge carries a scroll-linked progress rail: a thin neutral
   track with an ember fill that grows as the list passes through view,
   read straight off framer-motion's useScroll on the <ol> itself (no
   window scroll listener). Static under reduced motion, where the fill is
   left unmounted entirely rather than faked.

   Z-Security has no verifiable bullets, so it renders as a compact single
   line instead of the usual heading-plus-list shape. That is an honest
   empty state, not a placeholder waiting to be filled in. */
export default function Log() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.85", "end 0.35"],
  });
  const fill = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <Section id="log" label="Experience">
      <Heading kicker="Log" index={5} island={<Island name="rail" />}>From bootcamp to public registers.</Heading>
      {/* Capped to the text measure and centred: at 1440px the panel's
          content column stopped well short of its own right edge, leaving
          the glass looking under-filled rather than airy. The rail lives in
          this same capped wrapper so it stays pinned to the panel's own
          left padding instead of the section's. */}
      <div className="relative mx-auto max-w-[1040px]">
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] left-9 top-10 bottom-10 hidden w-px rounded-full bg-line md:block lg:left-11"
        >
          {!reduced && (
            <motion.div
              className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-ember"
              style={{ scaleY: fill }}
            />
          )}
        </div>
        <ol
          ref={listRef}
          className="glass glass-panel glass-dark-deep divide-y divide-line px-6 md:pl-16 md:pr-10 lg:pl-20 lg:pr-12"
        >
          {LOG.map((e) => {
            const compact = e.points.length === 0;
            return compact ? (
              <li key={e.org} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-6 md:py-7">
                <span className="text-[13px] text-faint">{e.period}</span>
                <span className="font-display text-[16px] font-medium text-ink">
                  {e.org}
                  <span className="text-body"> / {e.role}</span>
                </span>
                <span className="text-[14px] text-ink/70">{e.scope}</span>
              </li>
            ) : (
              <li
                key={e.org}
                className="grid gap-4 py-8 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-10 md:py-10"
              >
                {/* The period sticks while its entry scrolls, so a long
                    entry never loses its date off the top. Aceternity's
                    Timeline does this with its year column
                    (21st.dev/@manuarora700/components/timeline); self-start
                    because a stretched grid cell has nowhere to stick to.
                    top-24 clears the floating nav. */}
                <div className="text-[13px] text-faint md:sticky md:top-24 md:self-start md:pt-1.5">
                  {e.period}
                </div>
                <div>
                  <h3 className="font-display text-[22px] font-medium leading-tight text-ink md:text-[26px]">
                    {e.org}
                    <span className="text-body"> / {e.role}</span>
                  </h3>
                  <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink/80">
                    {e.scope}
                  </p>
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
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
