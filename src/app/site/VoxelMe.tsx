"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/* Pavle as a Minecraft-style block figure, in plain CSS 3D. No canvas, no
   WebGL, no library: six cuboids built from divs, each face cut out of one
   64x64 skin (public/images/voxel/pavle-skin.png, ~1.8 KB, an original skin
   in the standard classic-arm layout) with background-position.

   Sizes are in skin pixels, the unit Minecraft uses: head 8x8x8, body 8x12x4,
   arms and legs 4x12x4, so the figure is 16 wide and 32 tall. `size` is how
   many screen pixels one skin pixel gets (--px); the default 6 makes him
   192px tall. Every box is `preserve-3d` inside one rig, so the browser
   depth-sorts the parts against each other, and every face is backface-
   hidden, so a closed box only ever shows its outer sides.

   The pose, the idle loop (breathing from the hips, a slow look left and
   right, a slight arm sway) and the wave on hover or keyboard focus all live
   in globals.css (VOXEL ME). Transform only, pivots at the neck, shoulders
   and hips. Under reduced motion he stands still, head tilted toward you.
   Add the `voxel-me--waving` class to hold him mid-wave.

   The loops pause whenever he is off screen or the tab is hidden, the same
   attribute switch as the hero: no state, no re-render. */

type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Side = "front" | "back" | "right" | "left" | "top" | "bottom";
/* x, y: where the box stands on the 16 x 32 figure. w, h, d: its size.
   u, v: the top-left corner of its net on the skin. "Right" is his right,
   the viewer's left. */
type Part = { name: string; x: number; y: number; w: number; h: number; d: number; u: number; v: number };

const SIDES: readonly Side[] = ["front", "back", "right", "left", "top", "bottom"];

const HEAD: Part = { name: "head", x: 4, y: 0, w: 8, h: 8, d: 8, u: 0, v: 0 };
const BODY: Part = { name: "body", x: 4, y: 8, w: 8, h: 12, d: 4, u: 16, v: 16 };
const ARM_R: Part = { name: "arm-r", x: 0, y: 8, w: 4, h: 12, d: 4, u: 40, v: 16 };
const ARM_L: Part = { name: "arm-l", x: 12, y: 8, w: 4, h: 12, d: 4, u: 32, v: 48 };
const LEG_R: Part = { name: "leg-r", x: 4, y: 20, w: 4, h: 12, d: 4, u: 0, v: 16 };
const LEG_L: Part = { name: "leg-l", x: 8, y: 20, w: 4, h: 12, d: 4, u: 16, v: 48 };

/* The skin's net for a w x h x d box at (u, v): top and bottom sit over the
   front and left; right, front, left and back run left to right under them,
   wrapping the box. */
function uv(side: Side, { u, v, w, d }: Part): [number, number] {
  switch (side) {
    case "top":
      return [u + d, v];
    case "bottom":
      return [u + d + w, v];
    case "right":
      return [u, v + d];
    case "front":
      return [u + d, v + d];
    case "left":
      return [u + d + w, v + d];
    case "back":
      return [u + 2 * d + w, v + d];
  }
}

function Cuboid({ part }: { part: Part }) {
  const box: Vars = { "--x": part.x, "--y": part.y, "--w": part.w, "--h": part.h, "--d": part.d };
  return (
    <div className={`vx-part vx-${part.name}`} style={box}>
      {SIDES.map((side) => {
        const [u, v] = uv(side, part);
        const face: Vars = { "--u": u, "--v": v };
        return <span key={side} className={`vx-face vx-face--${side}`} style={face} />;
      })}
    </div>
  );
}

/* Without `size`, --px comes from an ancestor's --voxel-px (6px if none):
   that is how the About island scales him with its own height. */
export default function VoxelMe({ size, className = "" }: { size?: number; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

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

  const scale: Vars | undefined = size ? { "--px": `${size}px` } : undefined;

  // Focusable only so a keyboard user can make him wave too.
  return (
    <div
      ref={root}
      role="img"
      aria-label="Pavle, built from blocks"
      tabIndex={0}
      className={`voxel-me ${className}`.trim()}
      style={scale}
    >
      <div className="vx-rig" aria-hidden>
        {/* head, body and arms breathe together, scaled from the hips */}
        <div className="vx-upper">
          <Cuboid part={BODY} />
          <Cuboid part={HEAD} />
          <Cuboid part={ARM_R} />
          <Cuboid part={ARM_L} />
        </div>
        <Cuboid part={LEG_R} />
        <Cuboid part={LEG_L} />
      </div>
    </div>
  );
}
