"use client";

import { useEffect, useRef, useState } from "react";
import { PROJECTS, type Project } from "../projects";
import { Section, Heading } from "./Section";
import MarketStrip from "./MarketStrip";

/* GitLab-style stacking cards. Every card is position: sticky with a top
   offset that grows by 18px per card, so as you scroll each one pins and
   the next slides up over it. The entrance (a small rise + scale, transform
   only) is a native CSS scroll-driven animation behind @supports, exactly
   as the reference does it; browsers without it simply show the cards.
   Below lg each card is a COMPACT cut (context, title, two-line blurb, the
   video, the three buttons) so it fits a phone screen and can still stack;
   the highlights, numbers and the live strip stay on the case-study page.
   Only the topmost visible card's video plays: one decoder at a time. */

const ORDER = ["cryptoflow", "ronin-duel", "arc-anime-tracker"];
const FEATURED = ORDER.map((s) => PROJECTS.find((p) => p.slug === s)).filter(
  (p): p is Project => Boolean(p)
);

export default function Features() {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Cards pin only when every card fits under the bar with room to spare;
  // otherwise (landscape phones, short laptops, fold covers) they are a
  // plain column, because a pinned card taller than the screen hides its
  // own bottom half. Measured on mount and on every resize.
  const [stack, setStack] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const cards = Array.from(el.children) as HTMLElement[];
      const mid = window.innerHeight * 0.55;
      let idx = 0;
      cards.forEach((c, i) => {
        if (c.getBoundingClientRect().top < mid) idx = i;
      });
      setActive(idx);
    };
    const fit = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stack-top")) || 96;
      const room = window.innerHeight - top - 8;
      setStack(cards.every((c) => c.offsetHeight <= room));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    fit();
    measure();
    const ro = new ResizeObserver(() => { fit(); onScroll(); });
    ro.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", fit);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Section id="features" label="Work">
      <Heading lead="Three solo builds, each rebuilt from scratch in 2026 and live at a real URL. The videos are the actual apps.">
        Work
      </Heading>
      <div ref={wrap} className={`relative ${stack ? "" : "stack-off"}`}>
        {FEATURED.map((p, i) => (
          <Card key={p.slug} project={p} index={i} playing={i === active} />
        ))}
      </div>
    </Section>
  );
}

function Card({ project, index, playing }: { project: Project; index: number; playing: boolean }) {
  return (
    <article
      className="stack-card glass glass-panel glass-dark sticky mb-6 overflow-hidden p-5 md:p-10 lg:mb-10 lg:p-12"
      style={{ top: `calc(var(--stack-top) + ${index} * var(--stack-step))` }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
        <div className="contents lg:block">
          <p className="truncate text-[12px] text-faint lg:text-[13px]">
            {project.role}, {project.context}
          </p>
          <h3 className="mt-2 font-display text-[clamp(1.6rem,3.4vw,2.8rem)] font-bold leading-[1] text-ink lg:mt-3">
            {project.title}
          </h3>
          <p className="mt-3 line-clamp-2 max-w-[52ch] text-[15px] leading-relaxed text-ink/80 lg:mt-5 lg:line-clamp-none md:text-[16px]">
            {project.blurb}
          </p>
          <ul className="mt-6 hidden max-w-[52ch] divide-y divide-line border-y border-line text-[14px] leading-relaxed text-ink/80 lg:block">
            {project.highlights.map((h) => (
              <li key={h} className="py-2.5">
                {h}
              </li>
            ))}
          </ul>
          {project.slug === "cryptoflow" && (
            <div className="hidden lg:block">
              <MarketStrip />
            </div>
          )}
          <dl className="mt-6 hidden max-w-[52ch] grid-cols-3 gap-4 lg:grid">
            {project.kpis.map((k) => (
              <div key={k.label}>
                <dt className="text-[12px] text-faint">{k.label}</dt>
                <dd className="mt-1 text-[14px] leading-snug text-ink">{k.value}</dd>
              </div>
            ))}
          </dl>
          <p className="order-3 mt-1 flex flex-wrap gap-2 text-[13px] lg:order-none lg:mt-8">
            <a href={project.live} target="_blank" rel="noreferrer" className="glass glass-btn glass-strong px-3.5 py-1.5 text-ink lg:px-4 lg:py-2">
              Live site
            </a>
            <a href={project.code} target="_blank" rel="noreferrer" className="glass glass-btn px-3.5 py-1.5 text-body hover:text-ink lg:px-4 lg:py-2">
              Code
            </a>
            <a href={`/work/${project.slug}`} className="glass glass-btn px-3.5 py-1.5 text-body hover:text-ink lg:px-4 lg:py-2">
              Case study
            </a>
          </p>
        </div>
        <div className="order-2 lg:order-none">
          <Demo project={project} playing={playing} />
        </div>
      </div>
    </article>
  );
}

/* The poster is always underneath; the video only decodes while its card is
   the topmost one on screen. */
function Demo({ project, playing }: { project: Project; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing && !document.hidden) v.play().catch(() => {});
    else v.pause();
  }, [playing]);
  return (
    <div className="plate relative aspect-[16/10] overflow-hidden rounded-[14px]">
      <img
        src={project.shot}
        alt=""
        width={960}
        height={600}
        loading="lazy"
        className="absolute inset-0 h-full w-full rounded-[14px] object-cover"
      />
      {project.video && (
        <video
          ref={ref}
          src={project.video}
          poster={project.shot}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full rounded-[14px] object-cover"
        />
      )}
    </div>
  );
}
