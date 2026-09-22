"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* Osmo "Parallax Scrolling" (21st.dev/@osmosupply/components/parallax-
   scrolling) with a looping video as the back plane: the same 120% stage,
   the same 117.5% / -17.5% plane sizing, the same 13-stop fade and radial
   vignette. The scrub is framer-motion's useScroll over [data-parallax-
   layers] (the 120% stage, not the 100svh section: targeting the section
   runs the motion ~17% fast), mapped to a translateY of 40% on the video
   plane and 20% on the name, ease none, exactly the Osmo timeline. That
   replaces the GSAP + ScrollTrigger + Lenis trio the port first shipped
   with: framer-motion is already on the page for the nav, the Work cards
   and the Log rail, so this is the one animation runtime the site pays for.

   The letters rise with a CSS keyframe (globals.css, .parallax__title
   .letter), staggered by --i. CSS, not a JS "from" tween, so the name is
   never gated on hydration: no JS means the animation still plays, reduced
   motion means it never runs and the letters simply sit there.

   The video is "Stunning Night Timelapse of the Alps" by Ivan Chumak on
   Pexels (pexels.com/video/35047335, Pexels License), cut into a seamless
   8.5 s loop, 1080p24 on desktop and a 720p re-encode on phones. The source
   is picked in JS from matchMedia rather than with <source media>: browsers
   do not reliably honour the media attribute inside <video>, and a phone
   was measured fetching both files (1.4 MB + 0.3 MB) before the first
   scroll. It plays only while the hero is on screen and the tab is visible. */

const VIDEO_DESKTOP = "/video/hero/alps-night.mp4";
const VIDEO_PHONE = "/video/hero/alps-night-720.mp4";
const POSTER = "/images/hero/alps-night-poster.webp";

export default function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // 0 while the stage's top is at the viewport top, 1 once its bottom gets
  // there: the same [0% 0%, 100% 0%] window Osmo's ScrollTrigger used.
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start start", "end start"],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    const trigger = stage.current;
    const v = video.current;
    if (!trigger || !v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // One file per device. The poster already covers first paint, so the
    // bytes only start once the client knows which cut it needs.
    v.src = window.matchMedia("(max-width: 767px)").matches ? VIDEO_PHONE : VIDEO_DESKTOP;

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
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div className="parallax" id="top">
      <section className="parallax__header" aria-label="Introduction">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div ref={stage} data-parallax-layers className="parallax__layers">
            <motion.video
              ref={video}
              className="parallax__layer-img"
              style={{ y: videoY }}
              poster={POSTER}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden
            />
            <motion.div className="parallax__layer-title" style={{ y: titleY }}>
              <p className="parallax__kicker">Software developer, Montenegro</p>
              <h1 className="parallax__title" aria-label="Pavle Tošić">
                <Word text="Pavle" weight="light" offset={0} />
                <Word text="Tošić" weight="bold" offset={5} />
              </h1>
            </motion.div>
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
   arrival reads as text rising out of the ground, not fading in. `offset` is
   how many letters came before this word, so the stagger runs across both. */
function Word({ text, weight, offset }: { text: string; weight: "light" | "bold"; offset: number }) {
  return (
    <span className={`word word--${weight}`} aria-hidden>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="clip">
          <span className="letter" style={{ "--i": offset + i } as React.CSSProperties}>
            {ch}
          </span>
        </span>
      ))}
    </span>
  );
}
