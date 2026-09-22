"use client";

import { Icon } from "@iconify/react";
import { useReducedMotion } from "framer-motion";
import type { Mark, MarkGroup } from "./content";
import "./icons";

/* One moving row of glass logo pills, then the smaller groups standing
   still under it. The marquee shape is adapted from
   https://21st.dev/@grootstudio/components/logo-marquee (mask-faded edges,
   a duplicated track, pause on hover): that component drives the track
   with framer-motion's `animate()` every frame, which this site avoids
   (see globals.css's PERF note) in favour of a plain CSS keyframe
   translating the track by one copy's width. The track is duplicated only
   when motion is allowed; under prefers-reduced-motion the CSS keyframe is
   also disabled, so a single, static, screen-reader-only copy stays in the
   DOM either way.

   Only the first group moves. There used to be a second, counter-running
   marquee for the day-job tools; two marquees on one page is the lazy
   version of the effect (docs/slop.md), and a row of three or five logos
   does not need to loop to be seen. So "On the job" and "Off the clock"
   are plain labelled rows of the same pills, no motion, and the orbit
   beside them is where those logos move. @iconify/react resolves the real
   logos at runtime, hence this being a client leaf off the server
   Inside.tsx. */

function Pill({ mark }: { mark: Mark }) {
  return (
    <li className="glass glass-pill flex shrink-0 items-center gap-2 px-3 py-1.5">
      <Icon icon={mark.icon} width={16} height={16} aria-hidden focusable="false" />
      <span className="text-[13px] text-body">{mark.name}</span>
    </li>
  );
}

function MovingRow({ group, duration }: { group: MarkGroup; duration: number }) {
  const reduced = useReducedMotion();
  // A short row still fits both loop copies on screen at once at desktop
  // widths, so the seam where it jumps back reads as a rendering bug
  // instead of a loop. Widen the base row first so one copy alone always
  // exceeds the container, then duplicate that for the seamless -50% loop.
  const marks = group.marks;
  const base = marks.length < 8 ? [...marks, ...marks] : marks;
  const track = reduced ? marks : [...base, ...base];

  return (
    <div className="marquee-row">
      <p className="text-[13px] text-faint">{group.heading}</p>
      <div className="marquee-mask mt-2">
        <ul
          className="marquee-track"
          style={{ animationDuration: `${duration}s` }}
          aria-hidden={reduced ? undefined : "true"}
        >
          {track.map((m, i) => (
            <Pill key={`${m.name}-${i}`} mark={m} />
          ))}
        </ul>
      </div>
      {!reduced && (
        <p className="sr-only">{marks.map((m) => m.name).join(", ")}</p>
      )}
    </div>
  );
}

function StillRow({ group }: { group: MarkGroup }) {
  return (
    <div>
      <p className="text-[13px] text-faint">{group.heading}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {group.marks.map((m) => (
          <Pill key={m.name} mark={m} />
        ))}
      </ul>
    </div>
  );
}

export default function StackMarquee({
  moving,
  still,
}: {
  moving: MarkGroup;
  still: MarkGroup[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <MovingRow group={moving} duration={34} />
      <div className="grid gap-6 sm:grid-cols-[auto_auto] sm:justify-start sm:gap-10">
        {still.map((g) => (
          <StillRow key={g.heading} group={g} />
        ))}
      </div>
    </div>
  );
}
