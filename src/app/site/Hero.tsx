"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SOCIAL } from "./content";

/* Osmo "Parallax Scrolling" (21st.dev/@osmosupply/components/parallax-
   scrolling), built the way the original is: a stack of painted planes
   moving at different speeds with the title sandwiched between them. Same
   120% stage, same 117.5% / -17.5% plane sizing, same 13-stop fade and
   radial vignette. The scrub is framer-motion's useScroll over [data-
   parallax-layers] (the 120% stage, not the 100svh section: targeting the
   section runs the motion ~17% fast).

   Three planes, back to front:
   - the gorge (translateY 0 -> 40%, the slowest, reads as far away),
   - the name (0 -> 20%),
   - the foreground rocks (0 -> -28%, faster than the page itself), which
     rise over the name about halfway through the hero's scroll. -28% is
     what gets them there: at Osmo's 0% the rocks never reach the name
     before the stage runs out (measured, ~150svh of scroll needed).

   The painting is one AI-generated anime-style still (Higgsfield, z_image),
   split offline into the back plate and a feathered foreground cut-out;
   the rock band under the cut-out was repainted as mist so nothing doubles
   when the planes separate. The waterfall moves in CSS (globals.css,
   .gorge*): soft water sheets and droplet trails falling inside a mask
   traced from the painted fall (fading out where it breaks into spray), a
   shimmering crest at the lip, churning foam puffs and rising spray where
   it lands, two drifting mist bands and a breathing glow at the base.
   Transform and opacity only, paused off screen, off under reduced motion.
   ~200 KB of stills in place of the 1.7 MB video pair this replaced.

   The letters rise with a CSS keyframe (globals.css, .parallax__title
   .letter), staggered by --i. CSS, not a JS "from" tween, so the name is
   never gated on hydration. */

const SCENE = "/images/hero/gorge.webp";
const FRONT = "/images/hero/gorge-front.webp";

// Foam puffs across the landing zone (position in the foam box, delay) and
// spray droplets (x in the scene, delay, sideways drift): fixed values, so
// the server and client markup match.
const FOAM = [
  { x: "22%", y: "58%", d: "0s" },
  { x: "50%", y: "46%", d: "-0.7s" },
  { x: "76%", y: "60%", d: "-1.4s" },
  { x: "38%", y: "70%", d: "-2.1s" },
  { x: "64%", y: "72%", d: "-1s" },
];
const SPRAY = [
  { x: "57.5%", d: "0s", dx: "-260%" },
  { x: "59.8%", d: "-0.6s", dx: "-120%" },
  { x: "61.2%", d: "-1.3s", dx: "-340%" },
  { x: "62.9%", d: "-2s", dx: "-60%" },
  { x: "64.4%", d: "-2.6s", dx: "-220%" },
  { x: "60.4%", d: "-3.2s", dx: "-400%" },
  { x: "63.6%", d: "-1.7s", dx: "-150%" },
  { x: "58.6%", d: "-3.6s", dx: "-300%" },
];

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // 0 while the stage's top is at the viewport top, 1 once its bottom gets
  // there: the same [0% 0%, 100% 0%] window Osmo's ScrollTrigger used.
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start start", "end start"],
  });
  const backY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const frontY = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);

  // The falls and mist loop forever in CSS; pause them whenever the hero is
  // off screen or the tab is hidden. An attribute, not state: no re-render.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let onScreen = true;
    const sync = () => {
      if (onScreen && !document.hidden) delete el.dataset.paused;
      else el.dataset.paused = "true";
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0 });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={root} className="parallax" id="top">
      <section className="parallax__header" aria-label="Introduction">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div ref={stage} data-parallax-layers className="parallax__layers">
            <motion.div className="parallax__layer-img gorge" style={{ y: backY }} aria-hidden>
              <div className="gorge__scene">
                <img src={SCENE} alt="" width={2048} height={1152} fetchPriority="high" decoding="async" className="gorge__plate" />
                <div className="gorge__glow" />
                <div className="gorge__falls">
                  <span className="gorge__water gorge__water--sheets" />
                  <span className="gorge__water gorge__water--trails-far" />
                  <span className="gorge__water gorge__water--trails" />
                </div>
                <div className="gorge__crest" />
                <div className="gorge__foam">
                  {FOAM.map((f, i) => (
                    <span key={i} style={{ "--fx": f.x, "--fy": f.y, "--fd": f.d } as React.CSSProperties} />
                  ))}
                </div>
                <div className="gorge__spray">
                  {SPRAY.map((p, i) => (
                    <span key={i} style={{ "--sx": p.x, "--sd": p.d, "--sdx": p.dx } as React.CSSProperties} />
                  ))}
                </div>
                <div className="gorge__mist gorge__mist--back" />
              </div>
            </motion.div>
            <motion.div className="parallax__layer-title" style={{ y: titleY }}>
              <p className="parallax__kicker">Software developer, Montenegro</p>
              <h1 className="parallax__title" aria-label="Pavle Tošić">
                <Word text="Pavle" weight="light" offset={0} />
                <Word text="Tošić" weight="bold" offset={5} />
              </h1>
              <p className="parallax__pitch">
                Front to back, database to the last animation. Open to remote work.
              </p>
              <div className="parallax__ctas">
                <a
                  href={`mailto:${SOCIAL.email}`}
                  className="rounded-full bg-ember px-6 py-3 text-[14px] font-semibold text-ember-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_10px_24px_-14px_rgba(0,0,0,0.6)] transition-colors duration-200 hover:bg-ember-hover"
                >
                  Email me
                </a>
                <a href="#work" className="glass glass-btn glass-dark px-6 py-3 text-[14px] text-ink">
                  See the work
                </a>
              </div>
            </motion.div>
            <motion.div className="parallax__layer-img gorge gorge--front" style={{ y: frontY }} aria-hidden>
              <div className="gorge__scene">
                <img src={FRONT} alt="" width={2048} height={352} decoding="async" className="gorge__front" />
                <div className="gorge__mist gorge__mist--front" />
              </div>
            </motion.div>
          </div>
        </div>
        {/* vignette under the fade, so the fade's end is exactly the page ground */}
        <div className="parallax__radial-gradient" />
        {/* the fade sits on the header, not inside the clipped stage */}
        <div className="parallax__fade" />
        <div className="parallax__fade parallax__fade--front" />
        <a href="#about" className="parallax__cue" aria-label="Scroll to About">
          <span>Scroll</span>
          <span className="parallax__cue-line" aria-hidden />
        </a>
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
