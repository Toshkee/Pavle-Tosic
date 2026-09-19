"use client";

import { Icon } from "@iconify/react";
import { useReducedMotion } from "framer-motion";
import type { Mark } from "./content";
import "./icons";

/* Two labelled rows of glass logo pills, moving opposite directions.
   Shape adapted from https://21st.dev/@grootstudio/components/logo-marquee
   (mask-faded edges, a duplicated track, pause on hover): that component
   drives the track with framer-motion's `animate()` every frame, which
   this site avoids (see globals.css's PERF note) in favour of a plain CSS
   keyframe translating the track by one copy's width. The track is
   duplicated only when motion is allowed; under prefers-reduced-motion the
   CSS keyframe is also disabled, so a single, static, screen-reader-only
   copy stays in the DOM either way. @iconify/react resolves the real logos
   at runtime, hence this being a client leaf off the server Inside.tsx. */

function Row({
  label,
  marks,
  reverse,
  duration,
}: {
  label: string;
  marks: Mark[];
  reverse?: boolean;
  duration: number;
}) {
  const reduced = useReducedMotion();
  // A short row (e.g. "On the job"'s 5 marks) still fits both loop copies on
  // screen at once at desktop widths, so the seam where it jumps back reads
  // as a rendering bug instead of a loop. Widen the base row first so one
  // copy alone always exceeds the container, then duplicate that for the
  // seamless -50% loop.
  const base = marks.length < 8 ? [...marks, ...marks] : marks;
  const track = reduced ? marks : [...base, ...base];

  return (
    <div className="marquee-row">
      <p className="text-[13px] text-faint">{label}</p>
      <div className="marquee-mask mt-2">
        <ul
          className="marquee-track"
          data-reverse={reverse ? "true" : undefined}
          style={{ animationDuration: `${duration}s` }}
          aria-hidden={reduced ? undefined : "true"}
        >
          {track.map((m, i) => (
            <li
              key={`${m.name}-${i}`}
              className="glass glass-pill flex shrink-0 items-center gap-2 px-3 py-1.5"
            >
              <Icon icon={m.icon} width={16} height={16} aria-hidden focusable="false" />
              <span className="text-[13px] text-body">{m.name}</span>
            </li>
          ))}
        </ul>
      </div>
      {!reduced && (
        <p className="sr-only">{marks.map((m) => m.name).join(", ")}</p>
      )}
    </div>
  );
}

export default function StackMarquee({
  byChoice,
  onTheJob,
}: {
  byChoice: Mark[];
  onTheJob: Mark[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Row label="By choice" marks={byChoice} duration={34} />
      <Row label="On the job" marks={onTheJob} duration={30} reverse />
    </div>
  );
}
