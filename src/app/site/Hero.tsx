"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Osmo "Parallax Scrolling" (21st.dev/@osmosupply/components/parallax-
   scrolling) with a looping video as the back plane: the same 120% stage,
   the same 117.5% / -17.5% plane sizing, the same GSAP ScrollTrigger
   timeline scrubbed over [data-parallax-layers], the same 13-stop fade and
   radial vignette. The video is "Stunning Night Timelapse of the Alps" by
   Ivan Chumak on Pexels (pexels.com/video/35047335, Pexels License), cut
   into a seamless 8.5 s loop, 1080p24 on desktop and a 720p re-encode on
   phones. It plays only while the hero is on screen and the tab is visible. */

const LAYERS = [
  { layer: "1", yPercent: 40 }, // the video plane
  { layer: "3", yPercent: 20 }, // the name
];

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = root.current?.querySelector<HTMLElement>("[data-parallax-layers]");
    const v = video.current;
    if (!trigger || !v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!reduced) {
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

    // playback only while visible: off screen or hidden tab pauses the decoder
    let onScreen = true;
    const sync = () => {
      if (reduced) return;
      if (onScreen && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0 });
    io.observe(trigger);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      ctx.revert();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div className="parallax" ref={root} id="reveal">
      <section className="parallax__header" aria-label="Introduction">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div data-parallax-layers className="parallax__layers">
            <video
              ref={video}
              data-parallax-layer="1"
              className="parallax__layer-img"
              poster="/images/hero/alps-night-poster.webp"
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              aria-hidden
            >
              <source src="/video/hero/alps-night-720.mp4" media="(max-width: 767px)" type="video/mp4" />
              <source src="/video/hero/alps-night.mp4" type="video/mp4" />
            </video>
            <div data-parallax-layer="3" className="parallax__layer-title">
              <p className="parallax__kicker">Software developer, Montenegro</p>
              <h1 className="parallax__title" aria-label="Pavle Tošić">
                <Word text="Pavle" weight="light" />
                <Word text="Tošić" weight="bold" />
              </h1>
            </div>
          </div>
        </div>
        {/* vignette under the fade, so the fade's end is exactly the page ground */}
        <div className="parallax__radial-gradient" />
        {/* the fade sits on the header, not inside the clipped stage */}
        <div className="parallax__fade" />
      </section>
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
