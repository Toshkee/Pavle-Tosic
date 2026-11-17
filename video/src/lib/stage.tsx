import React, { createContext, useContext, useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { CLAY, H, STAGE_H, STAGE_SCALE, STAGE_W, W, type Theme, LIGHT } from "./theme";
import { hash, type Pt } from "./motion";

const ThemeCtx = createContext<Theme>(LIGHT);
export const ThemeProvider = ThemeCtx.Provider;
export const useT = () => useContext(ThemeCtx);

/* The camera over the 1280x720 stage: `zoom` 1 shows all of it, (cx, cy) is
   the stage point at the middle of the frame. */
export type Camera = { zoom: number; cx: number; cy: number };
export const WIDE: Camera = { zoom: 1, cx: STAGE_W / 2, cy: STAGE_H / 2 };

const matrix = ({ zoom, cx, cy }: Camera) => {
  const s = STAGE_SCALE * zoom;
  return { s, tx: W / 2 - cx * s, ty: H / 2 - cy * s };
};

/** A page laid out in the site's own px, seen through the camera. */
export const Stage: React.FC<{
  camera?: Camera;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ camera = WIDE, children, style }) => {
  const { s, tx, ty } = matrix(camera);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: STAGE_W,
        height: STAGE_H,
        transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* The site's cursor trail (src/app/site/trail.ts) with the same numbers:
   dots on a 14 px grid, characters in the middle of the wake, Claude's
   orange, e^(-t / 0.8 s). The site keeps a level per cell and fades it each
   frame; a film frame has no yesterday, so here every frame replays the
   last 3.4 s of the pointer's path and takes, per cell, the strongest stamp
   that is still alive. Same picture, from the path alone. */
const CELL = 14;
const RADIUS = 70;
const FULL_SPEED = 2.2; // px per ms
const RAMP = ":-=+*#%@";
const DOT = 0.2;
const SHOW = 0.04;
const EDGE_CLAY = 0.55;
const SHADES = 8;
const FADE_FRAMES = 0.8 * 60;
const MEMORY = 204; // frames: a full stamp is under SHOW by then
const FONT = "600 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const Wake: React.FC<{
  /** The pointer on the stage at a frame, or null while it is away. */
  cursor: (f: number) => Pt | null;
  camera?: Camera;
  /** Stronger and wider than a mouse would stir it: 1 is the site's. */
  gain?: number;
}> = ({ cursor, camera = WIDE, gain = 1 }) => {
  const frame = useCurrentFrame();
  const theme = useT();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const originX = (STAGE_W / 2) % CELL;
    const originY = (STAGE_H / 2) % CELL;
    const cols = Math.ceil((STAGE_W - originX) / CELL) + 1;
    const rows = Math.ceil((STAGE_H - originY) / CELL) + 1;
    const level = new Float32Array(cols * rows);

    const stamp = (x: number, y: number, radius: number, strength: number) => {
      const c0 = Math.max(0, Math.floor((x - radius - originX) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((x + radius - originX) / CELL));
      const r0 = Math.max(0, Math.floor((y - radius - originY) / CELL));
      const r1 = Math.min(rows - 1, Math.ceil((y + radius - originY) / CELL));
      for (let r = r0; r <= r1; r++) {
        const dy = originY + r * CELL - y;
        for (let c = c0; c <= c1; c++) {
          const dx = originX + c * CELL - x;
          const distance = Math.hypot(dx, dy);
          if (distance >= radius) continue;
          const k = 1 - distance / radius;
          const value = strength * k * k * (3 - 2 * k);
          const i = r * cols + c;
          if (value > level[i]) level[i] = value;
        }
      }
    };

    // Two samples a frame, oldest first.
    for (let f = Math.max(0, frame - MEMORY); f <= frame; f += 0.5) {
      const a = cursor(f - 0.5);
      const b = cursor(f);
      if (!a || !b) continue;
      const moved = Math.hypot(b.x - a.x, b.y - a.y);
      if (moved < 0.02) continue;
      // Speed over the last three frames, for the smoothing the site does.
      const back = cursor(f - 3) ?? a;
      const speed = Math.hypot(b.x - back.x, b.y - back.y) / (3 * (1000 / 60));
      const s = Math.min(1, (speed * gain) / FULL_SPEED);
      const radius = RADIUS * (0.55 + 0.45 * s) * Math.min(1.4, gain);
      const strength = Math.min(1, 0.45 + 0.7 * s) * Math.exp(-(frame - f) / FADE_FRAMES);
      if (strength < SHOW) continue;
      const steps = Math.max(1, Math.ceil(moved / (CELL / 2)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        stamp(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, radius, strength);
      }
    }

    const grey = rgb(theme.dark ? theme.faint : "#71717a");
    const clay = rgb(CLAY);
    const shades = Array.from({ length: SHADES }, (_, s) => {
      const q = EDGE_CLAY + ((1 - EDGE_CLAY) * s) / (SHADES - 1);
      const [r, g, b] = grey.map((v, k) => Math.round(v + (clay[k] - v) * q));
      return `rgb(${r},${g},${b})`;
    });

    const { s, tx, ty } = matrix(camera);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(s, 0, 0, s, tx, ty);
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const top = RAMP.length - 1;
    // The shimmer: each cell steps along the ramp every 0.7 s or so, on its
    // own phase.
    const beat = frame / 42;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const e = level[i];
        if (e < SHOW) continue;
        const x = originX + c * CELL;
        const y = originY + r * CELL;
        ctx.globalAlpha = 0.4 + 0.45 * e;
        if (e < DOT) {
          ctx.fillStyle = shades[0];
          ctx.beginPath();
          ctx.arc(x, y, 0.8 + 5 * e, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const q = (e - DOT) / (1 - DOT);
          ctx.fillStyle = shades[Math.round(Math.sqrt(q) * (SHADES - 1))];
          const jitter = Math.floor(hash(i * 13 + Math.floor(beat + hash(i) * 7) * 7919) * 3);
          const step = Math.round(q * top) + jitter - 1;
          ctx.fillText(RAMP[Math.max(0, Math.min(top, step))], x, y);
        }
      }
    }
    ctx.globalAlpha = 1;
  });

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, width: W, height: H }}
    />
  );
};

/* The visitor's pointer, the film's one recurring character: the macOS
   arrow the demo clips are filmed with (scripts/record-demos.mjs), dipping
   on a click, with a soft ring. Lives on the stage. */
export const Pointer: React.FC<{
  cursor: (f: number) => Pt | null;
  clicks?: number[];
}> = ({ cursor, clicks = [] }) => {
  const frame = useCurrentFrame();
  const theme = useT();
  const at = cursor(frame);
  if (!at) return null;
  const since = clicks.map((c) => frame - c).filter((d) => d >= 0);
  const last = since.length ? Math.min(...since) : 999;
  const dip = last < 5 ? 0.84 : last < 12 ? 0.84 + (0.16 * (last - 5)) / 7 : 1;
  return (
    <>
      {last < 30 && (
        <div
          style={{
            position: "absolute",
            left: at.x - 23,
            top: at.y - 23,
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: `1.5px solid ${theme.dark ? "rgba(255,255,255,.7)" : "rgba(10,10,10,.5)"}`,
            transform: `scale(${0.4 + 0.8 * (last / 30)})`,
            opacity: 1 - last / 30,
          }}
        />
      )}
      <svg
        width={28}
        height={28}
        viewBox="0 0 28 28"
        style={{
          position: "absolute",
          left: at.x - 6,
          top: at.y - 3.5,
          transformOrigin: "6px 3.5px",
          transform: `scale(${dip})`,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,.3))",
        }}
      >
        <path
          d="M6 3.5v18.2l4.6-4.4 3 6.9 3.3-1.4-2.9-6.8h6.4z"
          fill="#111"
          stroke="#fff"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

/* The site's theme switch: the new page opens as a circle from a point.
   In screen px. */
export const CircleReveal: React.FC<{
  at: Pt;
  /** 0 closed, 1 fully open. */
  open: number;
  children: React.ReactNode;
}> = ({ at, open, children }) => {
  const far = Math.hypot(Math.max(at.x, W - at.x), Math.max(at.y, H - at.y));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath: open >= 1 ? undefined : `circle(${open * far}px at ${at.x}px ${at.y}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** Stage px to frame px, for the things drawn over the stage. */
export const toScreen = (pt: Pt, camera: Camera = WIDE): Pt => {
  const { s, tx, ty } = matrix(camera);
  return { x: pt.x * s + tx, y: pt.y * s + ty };
};
