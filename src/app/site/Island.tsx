"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* A floating voxel island beside a section heading (Section.tsx's Heading
   takes one). Each is an AI-generated isometric diorama (Higgsfield z_image,
   rendered on a flat pink studio backdrop and chroma-keyed offline: pink
   connected to the border plus any strongly pink pocket, a 1px choke, a
   soft feather and a magenta despill on the edge), cropped to its own
   bounding box, so `children` can be placed in percent of the island.

   Three motions, all CSS (globals.css, ISLANDS), transform and opacity only:
   - drift: a scroll-linked rise across the island's pass through the
     viewport (animation-timeline: view(), behind @supports, so browsers
     without it keep the island still),
   - bob: a slow float, 7 s, never in step with the drift,
   - motes: a few small warm blocks rising off the underside and fading.
   Bob and motes pause while the island is off screen or the tab is hidden
   (the same data-paused attribute Hero.tsx uses); reduced motion stops all
   three. The island is decorative: the img has empty alt. */

export type IslandName = "cabin" | "workshop" | "village" | "ores" | "rail" | "beacon";

// Natural size of each 900-wide export, for the img's width/height (no CLS).
const HEIGHT: Record<IslandName, number> = {
  cabin: 971,
  workshop: 1222,
  village: 965,
  ores: 907,
  rail: 1164,
  beacon: 1022,
};

// x positions (percent of the island's width) the motes rise from, and their
// delays, spread so no two leave together.
const MOTES = [
  { x: 34, d: 0 },
  { x: 58, d: 1.3 },
  { x: 46, d: 2.6 },
  { x: 66, d: 3.4 },
  { x: 40, d: 4.7 },
  { x: 52, d: 5.9 },
];

export default function Island({
  name,
  className = "",
  children,
}: {
  name: IslandName;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let onScreen = false;
    const sync = () => {
      if (onScreen && !document.hidden) delete el.dataset.paused;
      else el.dataset.paused = "true";
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { rootMargin: "100px 0px" });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={ref} className={`island island--${name} ${className}`}>
      <div className="island__drift">
        <div className="island__bob">
          <span aria-hidden className="island__glow" />
          <img
            src={`/images/islands/${name}.webp`}
            srcSet={`/images/islands/${name}-sm.webp 480w, /images/islands/${name}.webp 900w`}
            sizes="(min-width: 1024px) 340px, 170px"
            alt=""
            width={900}
            height={HEIGHT[name]}
            loading="lazy"
            decoding="async"
            className="island__img"
          />
          {children}
          {MOTES.map((m, i) => (
            <span
              key={i}
              aria-hidden
              className="island__mote"
              style={{ left: `${m.x}%`, animationDelay: `${m.d}s` } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
