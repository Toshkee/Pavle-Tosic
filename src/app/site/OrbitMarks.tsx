"use client";

import { Icon } from "@iconify/react";
import type { CSSProperties } from "react";
import { MARKS } from "./content";
import "./icons";

/* The landing page's background: my stack's marks circling the centre on
   three rings, after Magic UI's Orbiting Circles
   (https://21st.dev/@dillionverma/components/orbiting-circles). The marks
   are MARKS from content.ts in CV order, one per icon (Oracle APEX and
   Oracle Database share a mark), with Claude Code moved to the front, so
   the inner ring holds Claude and the frontend core. Pure CSS (.orbit in globals.css): the icons are bundled and
   rendered on the server (`ssr`), the rings turn by transform alone, and
   under reduced motion every mark sits still where it starts. Decorative:
   the stack is spelled out on /about and in the chat's Skills card. */

// Ring radius in px at full size (scaled down on small screens by
// --orbit-unit), how many marks it carries, and seconds per turn; the
// middle ring turns the other way. The inner ring clears the title and
// the question box (about 330px from the centre at full size), so the
// marks pass beside the content, not through it.
const RINGS = [
  { radius: 380, count: 5, seconds: 70, reverse: false },
  { radius: 540, count: 6, seconds: 95, reverse: true },
  { radius: 700, count: 7, seconds: 120, reverse: false },
];

// Claude Code goes first, onto the inner ring where it is always in view
// (in CV order it would be the outer ring's last mark, mostly faded out).
const CLAUDE = "logos:claude-icon";
const unique = MARKS.flatMap((group) => group.marks)
  .filter((mark, index, all) => all.findIndex((other) => other.icon === mark.icon) === index)
  .sort((a, b) => Number(b.icon === CLAUDE) - Number(a.icon === CLAUDE));

let next = 0;
const rings = RINGS.map((ring, ringIndex) => {
  const marks = unique.slice(next, next + ring.count);
  next += ring.count;
  // Each ring starts a little further round, so no two marks line up.
  return { ...ring, marks, offset: ringIndex * 23 };
});

export default function OrbitMarks() {
  return (
    <div aria-hidden className="orbit">
      {rings.map(({ radius, seconds, reverse, marks, offset }) => (
        <div
          key={radius}
          className="orbit-ring"
          style={
            {
              "--radius": `calc(${radius} * var(--orbit-unit))`,
              "--duration": `${seconds}s`,
              "--direction": reverse ? "reverse" : "normal",
            } as CSSProperties
          }
        >
          {marks.map((mark, index) => (
            <span
              key={mark.icon}
              className="orbit-mark"
              style={{ "--angle": `${offset + (360 / marks.length) * index}deg` } as CSSProperties}
            >
              <Icon
                icon={mark.icon}
                ssr
                // A fixed base for the gradient ids inside the SVG, so the
                // server's and the browser's markup match.
                id={`orbit-${mark.icon.replace(":", "-")}`}
                className="size-1/2"
                style={{ color: mark.color }}
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
