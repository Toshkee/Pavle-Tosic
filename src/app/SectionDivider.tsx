"use client";

import { memo, type CSSProperties } from "react";

/* A thin, edge-fading line with a single glowing pulse that travels along it.
   Lives in the empty gap between sections, so it adds gentle motion down the
   page without ever crossing content. Pure CSS animation → the global
   prefers-reduced-motion rule freezes the pulse (resting centred).
   `container-type: inline-size` lets the pulse travel via a `cqw` transform
   (compositor-only) instead of animating `left` (layout/paint every frame). */
function SectionDivider({
  dur = 7,
  reverse = false,
}: {
  dur?: number;
  reverse?: boolean;
}) {
  return (
    <div aria-hidden className="relative h-6 w-full [container-type:inline-size] lg:h-10">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      <span
        className="section-pulse absolute top-1/2 h-1.5 w-1.5 rounded-full bg-accent"
        style={
          {
            boxShadow: "0 0 8px 1px var(--color-accent)",
            animationDuration: `${dur}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      />
    </div>
  );
}

export default memo(SectionDivider);
