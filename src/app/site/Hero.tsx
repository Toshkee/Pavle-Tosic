"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Osmo "Parallax Scrolling" (21st.dev/@osmosupply/components/parallax-
   scrolling), ported as-is: the same three layer images in the same order,
   the same 120% stage, the same 117.5% / -17.5% layer sizing, the same
   GSAP ScrollTrigger timeline scrubbed over [data-parallax-layers]
   (yPercent 70 / 55 / 40 / 10), the same 13-stop fade and radial vignette.
   Lenis already runs site-wide from SmoothScroll.tsx; ScrollTrigger reads
   the window scroll it drives. Only the title changed. */

const LAYERS = [
  { layer: "1", yPercent: 70 },
  { layer: "2", yPercent: 55 },
  { layer: "3", yPercent: 40 },
  { layer: "4", yPercent: 10 },
];

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = root.current?.querySelector<HTMLElement>("[data-parallax-layers]");
    if (!trigger) return;
    const ctx = gsap.context(() => {
      // the name arrives: each letter rises out of its own clip, staggered,
      // the two words at different weights. Skipped under reduced motion.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.from(".parallax__title .letter", {
          yPercent: 115,
          rotate: 4,
          duration: 1.15,
          ease: "expo.out",
          stagger: { each: 0.045, from: "start" },
          delay: 0.25,
        });
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger, start: "0% 0%", end: "100% 0%", scrub: 0 },
      });
      LAYERS.forEach((l, idx) => {
        tl.to(
          trigger.querySelectorAll(`[data-parallax-layer="${l.layer}"]`),
          { yPercent: l.yPercent, ease: "none" },
          idx === 0 ? undefined : "<"
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="parallax" ref={root} id="reveal">
      <section className="parallax__header" aria-label="Introduction">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div data-parallax-layers className="parallax__layers">
            <img
              src="/images/hero/osmo-layer-3.webp"
              loading="eager"
              fetchPriority="high"
              width={2000}
              height={1906}
              data-parallax-layer="1"
              alt=""
              className="parallax__layer-img"
            />
            <img
              src="/images/hero/osmo-layer-2.webp"
              loading="eager"
              width={2000}
              height={1906}
              data-parallax-layer="2"
              alt=""
              className="parallax__layer-img"
            />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h1 className="parallax__title" aria-label="Pavle Tošić">
                <Word text="Pavle" weight="light" />
                <Word text="Tošić" weight="bold" />
              </h1>
            </div>
            <img
              src="/images/hero/osmo-layer-1.webp"
              loading="eager"
              width={2000}
              height={1906}
              data-parallax-layer="4"
              alt=""
              className="parallax__layer-img"
            />
          </div>
          <div className="parallax__fade" />
        </div>
      </section>
      <div className="parallax__radial-gradient" />
    </div>
  );
}

/* One word, letter by letter, each letter inside its own overflow clip so the
   arrival reads as text rising out of the ground, not fading in. */
function Word({ text, weight }: { text: string; weight: "light" | "bold" }) {
  return (
    <span className={`word word--${weight}`} aria-hidden>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="clip">
          <span className="letter">{ch}</span>
        </span>
      ))}
    </span>
  );
}
