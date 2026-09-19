"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PROJECTS, type Project } from "../projects";
import { Section, Heading } from "./Section";
import MarketStrip from "./MarketStrip";
import NumberFlow from "@number-flow/react";

/* GitLab-style stacking cards, ONE mechanism end to end (no JS fit-check,
   no CSS view() entrance): each card is position: sticky with a top offset
   that grows by var(--stack-step) per card (globals.css), and pins only at
   lg and up: the breakpoint IS the fit check, so nothing is measured at
   runtime. The sticky element is a direct child of the shared container
   below (no extra wrapper div around it) so that container, tall enough to
   hold every card, is what gives each card room to actually stick.
   The scale-down-as-it-gets-covered effect reads a single useScroll on that
   shared container and maps each card's own slice of the range to a scale;
   it only runs at lg, where cards pin, so the card being read never shrinks.
   Highlights, KPIs and the live market strip render on every size, reflowed
   (single column, then 3-up from sm), so a phone gets the same case for
   each build, not a teaser. Only the card nearest the pin line has its
   video decoding: an IntersectionObserver (not scroll) tracks that, on
   every breakpoint. */

const ORDER = ["cryptoflow", "ronin-duel", "arc-anime-tracker"];
const FEATURED = ORDER.map((s) => PROJECTS.find((p) => p.slug === s)).filter(
  (p): p is Project => Boolean(p)
);

/* Whether the pin/scale mechanism is live (matches the lg breakpoint the
   CSS stack-card rule uses). useSyncExternalStore, not an effect + setState,
   so there is no extra render pass and the server snapshot (false) matches
   what SSR/first paint render before hydration can confirm the width. */
const LG_QUERY = "(min-width: 1024px)";
function subscribeLg(callback: () => void) {
  const mq = window.matchMedia(LG_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getLgSnapshot() {
  return window.matchMedia(LG_QUERY).matches;
}
function getLgServerSnapshot() {
  return false;
}
function useIsLg() {
  return useSyncExternalStore(subscribeLg, getLgSnapshot, getLgServerSnapshot);
}

export default function Features() {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const els = cardRefs.current.filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    // A thin band just under the floating nav bar: whichever card's box is
    // passing through it right now is the one on top, pinned or not.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) setActive(idx);
        });
      },
      { rootMargin: "-90px 0px -45% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));

    // The band observer above only ever turns a card ON (isIntersecting).
    // Without this, scrolling the whole section out of view (e.g. straight
    // to the footer) leaves the last-active card's <video> decoding
    // indefinitely off-screen. This one watches the section as a whole and
    // clears `active` on the way out; the band observer sets it back once
    // any card re-enters.
    const container = containerRef.current;
    const sectionIO = container
      ? new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) setActive(-1);
          },
          { threshold: 0 }
        )
      : null;
    if (container && sectionIO) sectionIO.observe(container);

    return () => {
      io.disconnect();
      sectionIO?.disconnect();
    };
  }, []);

  return (
    <Section id="features" label="Work">
      <Heading lead="Three solo builds, each rebuilt from scratch in 2026 and live at a real URL. The videos are the actual apps.">
        Work
      </Heading>
      <div ref={containerRef} className="relative">
        {FEATURED.map((p, i) => (
          <Card
            key={p.slug}
            project={p}
            index={i}
            count={FEATURED.length}
            progress={scrollYProgress}
            playing={i === active}
            cardRef={(el) => {
              cardRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </Section>
  );
}

function Card({
  project,
  index,
  count,
  progress,
  playing,
  cardRef,
}: {
  project: Project;
  index: number;
  count: number;
  progress: import("framer-motion").MotionValue<number>;
  playing: boolean;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const reduced = useReducedMotion();
  const isLg = useIsLg();
  const isLast = index === count - 1;
  // This card's own slice of the container's scroll range: 1 while it is
  // the top card, down to 0.94 by the time the next card has covered it (a
  // no-op range for the last card, nothing ever covers it).
  const scale = useTransform(
    progress,
    [index / count, (index + 1) / count],
    [1, isLast ? 1 : 0.94]
  );

  return (
    <div
      ref={cardRef}
      data-index={index}
      className="stack-card glass glass-panel glass-dark mb-6 overflow-hidden lg:mb-10"
      style={{ top: `calc(var(--stack-top) + ${index} * var(--stack-step))` }}
    >
      <motion.article
        className="p-5 md:p-10 lg:p-12"
        style={{ scale: reduced || !isLg ? 1 : scale }}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
          <div className="contents lg:block">
            <p className="truncate text-[12px] text-faint lg:text-[13px]">
              {project.role}, {project.context}
            </p>
            <h3 className="mt-2 font-display text-[clamp(1.6rem,3.4vw,2.8rem)] font-bold leading-[1] text-ink lg:mt-3">
              {project.title}
            </h3>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink/80 lg:mt-5 md:text-[16px]">
              {project.blurb}
            </p>
            <ul className="order-2 mt-6 max-w-[52ch] divide-y divide-line border-y border-line text-[14px] leading-relaxed text-ink/80 lg:order-none">
              {project.highlights.map((h) => (
                <li key={h} className="py-2.5">
                  {h}
                </li>
              ))}
            </ul>
            <dl className="order-2 mt-6 grid max-w-[52ch] grid-cols-1 gap-4 sm:grid-cols-3 lg:order-none lg:gap-6">
              {project.kpis.map((k) => (
                <Kpi key={k.label} label={k.label} value={k.value} />
              ))}
            </dl>
            {project.slug === "cryptoflow" && (
              <div className="order-2 lg:order-none">
                <MarketStrip />
              </div>
            )}
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
          <div className="order-1 lg:order-none">
            <Demo project={project} playing={playing} />
          </div>
        </div>
      </motion.article>
    </div>
  );
}

/* "48, run against Postgres" -> 48 + ", run against Postgres". Only a
   plain leading count animates; ranges ("1-125×") and zero stay static. */
function splitCount(value: string): { n: number; rest: string } | null {
  const m = /^(\d{1,3}(?:,\d{3})+|\d+)(?![\d-])/.exec(value);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return n > 0 ? { n, rest: value.slice(m[1].length) } : null;
}

function Kpi({ label, value }: { label: string; value: string }) {
  const parts = splitCount(value);
  return (
    <div>
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className="mt-1 text-[14px] leading-snug text-ink">
        {parts ? (
          <>
            <span className="sr-only">{value}</span>
            <span aria-hidden>
              <CountUp to={parts.n} />
              {parts.rest}
            </span>
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

/* Server HTML and no-JS show the real number. On the client, a count that
   is still below the fold drops to 0 and ticks up once when it scrolls in;
   one already on screen, or under reduced motion, never moves. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    setShown(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setShown(to);
        io.disconnect();
      },
      // threshold: 1 (fully visible) can never fire inside the stacking
      // cards' lg scale transform, which the observer's intersection ratio
      // can't quite reach 1 against; 0.6 is enough to mean "the KPI is
      // actually readable" without depending on an exact transform.
      { threshold: 0.6, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      <NumberFlow value={shown} locales="en-US" transformTiming={{ duration: 900, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }} spinTiming={{ duration: 900, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }} />
    </span>
  );
}

/* The poster is always underneath; the video only decodes while its card is
   the topmost one on screen. */
function Demo({ project, playing }: { project: Project; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Every card's <video> downloading in full on mount (preload="metadata"
  // still fetches a fair chunk, and browsers vary) was 2.6 MB across four
  // cards before a single scroll. Mounting the element only once the card
  // has actually been the active one at least once means the poster image
  // alone carries every card until then. React's documented "adjusting
  // state when a prop changes" shape (setState during render, not inside an
  // effect): it re-renders once more before the browser paints, so the
  // video element mounts in the same commit `playing` first goes true, and
  // the effect below can find it.
  const [prevPlaying, setPrevPlaying] = useState(playing);
  const [everPlayed, setEverPlayed] = useState(playing);
  if (playing !== prevPlaying) {
    setPrevPlaying(playing);
    if (playing) setEverPlayed(true);
  }
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
      {project.video && everPlayed && (
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
