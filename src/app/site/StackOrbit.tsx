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
   chips are decorative. */

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
          className="orbit-chip glass glass-pill"
          data-reverse={reverse ? "true" : undefined}
          title={m.name}
          style={{
            animationDuration: `${duration}s`,
            animationDelay: `${-((duration * i) / marks.length)}s`,
          }}
        >
          <Icon icon={m.icon} width={20} height={20} aria-hidden focusable="false" />
        </span>
      ))}
    </div>
  );
}

export default function StackOrbit({ inner, outer }: { inner: Mark[]; outer: Mark[] }) {
  const all = [...inner, ...outer].map((m) => m.name).join(", ");
  return (
    <div className="orbit mx-auto" role="img" aria-label={`Tools orbiting: ${all}`}>
      <Ring marks={inner} duration={26} />
      <Ring marks={outer} duration={38} reverse />
    </div>
  );
}
