"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PROJECTS, type Project } from "../projects";
import { Section, Heading } from "./Section";
import MarketStrip from "./MarketStrip";
import Island from "./Island";
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

/* The Work stack is every "build" in projects.ts, in data order: my own
   studio first, then the bootcamp rebuilds, then the team sprint. Client
   sites are Field.tsx's. */
const FEATURED = PROJECTS.filter((p) => p.kind === "build");

/* Each card's ambient glow, after 21st.dev/@unlumen/components/video-ambient
   (YouTube "ambient mode"). That component samples live video frames onto a
   blurred canvas; here the colour is sampled once, offline, and drawn as a
   static radial gradient, because a live blur inside five sticky, scaling
   cards is the kind of cost globals.css's glass note rules out. The most vivid
   colour in the project's own screenshot (saturation x value weighted
   average of the poster, re-lit to 85% value), so every card carries its
   app's colour without the page picking up a second accent. Ronin's
   sample (#9798d8) is nudged bluer to keep purple off the page. */
const GLOW: Record<string, string> = {
  vaky: "#d83456",
  cryptoflow: "#40d89b",
  "ronin-duel": "#7f8fd8",
  "arc-anime-tracker": "#d86e7e",
  meet2explore: "#0d84d8",
};

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
    <Section id="work" label="Work">
      <Heading
        kicker="Work"
        index={2}
        island={<Island name="workshop" />}
        lead="My studio's site and back office, three bootcamp projects rebuilt from scratch in 2026, and one team sprint. The videos are the actual apps."
      >
        Five builds. All of them live.
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
            covered={active > i}
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
  covered,
  cardRef,
}: {
  project: Project;
  index: number;
  count: number;
  progress: import("framer-motion").MotionValue<number>;
  playing: boolean;
  covered: boolean;
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
      // Once the band observer has moved on to a later card, this one is
      // under it: its content dims (globals.css, lg only) so the strip
      // still showing above the next card reads as "behind", not as a
      // second live headline. State-driven, not scroll-linked, because the
      // container-progress slice above is only approximate per card (cards
      // differ in height) and a card being read must never look dimmed.
      // Aceternity's StickyScroll dims its inactive items the same way
      // (21st.dev/@manuarora700/components/sticky-scroll-reveal).
      data-covered={covered ? "true" : undefined}
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* the glow sits on the card, behind the demo: a static gradient, no filter */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 70% at 72% 50%, color-mix(in srgb, ${GLOW[project.slug] ?? "#ffffff"} 22%, transparent), transparent 70%)`,
        }}
      />
      <motion.article
        className="relative p-5 md:p-10 lg:p-12"
        style={{ scale: reduced || !isLg ? 1 : scale }}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] lg:items-center lg:gap-12">
          <div className="contents lg:block">
            <p className="truncate text-[12px] text-faint lg:text-[13px]">
              <span className="mr-2 font-display tabular-nums text-ink">
                {String(index + 1).padStart(2, "0")}
                <span className="text-faint"> / {String(count).padStart(2, "0")}</span>
              </span>
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
            <dl className="order-2 mt-6 grid max-w-[52ch] grid-cols-1 gap-5 sm:grid-cols-3 lg:order-none lg:gap-6">
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
              {/* the primary action: solid ink, not ember (ember is the email CTA's) */}
              <a href={project.live} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-3.5 py-1.5 font-semibold text-bg transition-colors hover:bg-white lg:px-4 lg:py-2">
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

/* The figure a KPI leads with, and the phrase that qualifies it:
   "500,000+ live AniList titles" -> "500,000+" / "live AniList titles",
   "1-125×, settled server-side" -> "1-125×" / "settled server-side",
   "one week, 18-24 Nov 2025" -> "one week" / "18-24 Nov 2025". */
function splitFigure(value: string): { figure: string; rest: string } {
  // commas only count INSIDE a number ("500,000"), never the one after it ("48,")
  const m = /^(\d(?:[\d,]*\d)?(?:-\d(?:[\d,]*\d)?)?[+×]?)(.*)$/.exec(value);
  const [figure, rest] = m ? [m[1], m[2]] : [value.split(",")[0], value.slice(value.split(",")[0].length)];
  return { figure, rest: rest.replace(/^[,\s]+/, "") };
}

function Kpi({ label, value }: { label: string; value: string }) {
  const count = splitCount(value);
  const { figure, rest } = splitFigure(value);
  return (
    <div>
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className="mt-1.5">
        <span className="sr-only">{value}</span>
        {/* long figures ("500,000+", "one week") step down a size so they
            never run into the next column at lg's narrow text column */}
        <span
          aria-hidden
          className={`block font-display font-bold leading-none text-ink ${
            figure.length > 5 ? "text-[clamp(1.2rem,1.55vw,1.5rem)]" : "text-[clamp(1.5rem,2.3vw,2.1rem)]"
          }`}
        >
          {count && figure === String(count.n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") ? <CountUp to={count.n} /> : figure}
        </span>
        {rest && (
          <span aria-hidden className="mt-1.5 block text-[13px] leading-snug text-ink/70">
            {rest}
          </span>
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
