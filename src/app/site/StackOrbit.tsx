"use client";

import { Icon } from "@iconify/react";
import type { Mark } from "./content";
import "./icons";

/* Two counter-rotating rings of glass icon chips, the section's one moving
   piece. Mechanism adapted from Magic UI's OrbitingCircles
   (https://21st.dev/@dillionverma/components/orbiting-circles): a CSS
   keyframe rotates each chip around the ring's centre, translates it out
   by the ring's radius, then rotates it back, so it stays upright while it
   orbits (see the `.orbit*` rules in globals.css for the shared keyframe
   and the negative-delay stagger). @iconify/react resolves the real logos
   at runtime, which is why this is its own client leaf off the server
   Inside.tsx. The ring is one `role="img"` for screen readers; individual
   chips are decorative, named on hover by a CSS label (data-name), and the
   whole orbit holds still while hovered so a label can be read. Chips are
   dark glass tiles, the material the pills beside them use: they were light
   "app icon" tiles once, because the GitHub, Unity and Astro marks are
   near-black, but white tiles were the brightest thing in the section and
   the Oracle wordmark didn't read at 26 px. Those four are one-colour
   Simple Icons now (content.ts, icons.ts), in ink, Oracle in its red. The
   core is Pavle, the one the tools go round: portrait-core.webp, a 256 px
   face-centred crop of the About portrait (8.7 KB, not the 163 KB
   original). */

function Ring({
  marks,
  reverse,
  duration,
}: {
  marks: Mark[];
  reverse?: boolean;
  duration: number;
}) {
  return (
    <div className={reverse ? "orbit-ring orbit-ring-outer" : "orbit-ring orbit-ring-inner"}>
      {marks.map((m, i) => (
        <span
          key={m.name}
          className="orbit-chip"
          data-reverse={reverse ? "true" : undefined}
          data-name={m.name}
          style={{
            animationDuration: `${duration}s`,
            animationDelay: `${-((duration * i) / marks.length)}s`,
          }}
        >
          <Icon icon={m.icon} color={m.color} width={26} height={26} aria-hidden focusable="false" />
        </span>
      ))}
    </div>
  );
}

export default function StackOrbit({ inner, outer }: { inner: Mark[]; outer: Mark[] }) {
  const all = [...inner, ...outer].map((m) => m.name).join(", ");
  return (
    <div className="orbit mx-auto" role="img" aria-label={`Tools orbiting: ${all}`}>
      <div className="orbit-core">
        <img src="/images/hero/portrait-core.webp" alt="" width={256} height={256} loading="lazy" decoding="async" />
      </div>
      <Ring marks={inner} duration={26} />
      <Ring marks={outer} duration={38} reverse />
    </div>
  );
}
